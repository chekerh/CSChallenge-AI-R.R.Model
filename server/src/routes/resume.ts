import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { unlinkSync } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Types } from 'mongoose';
import { analyzeResume, aiErrorStatus } from '../openai';
import { requireAuth } from '../middleware/authMiddleware';
import { consumeQuota, hasFeature } from '../billing/entitlements';
import Resume from '../models/Resume';
import ResumeVersion from '../models/ResumeVersion';
import Feedback from '../models/Feedback';
import { trackEvent } from '../analytics/events';
import pino from 'pino';

const log = pino({ name: 'resume' });

const router = express.Router();

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    if (allowed.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF, DOC/DOCX, and TXT files are allowed'));
  },
});

function badId(res: express.Response): void {
  res.status(400).json({ error: 'invalid id' });
}

async function assertResumeOwner(
  resumeId: string,
  userId: string
): Promise<boolean> {
  if (!Types.ObjectId.isValid(resumeId)) return false;
  const r = await Resume.findOne({ _id: resumeId, user_id: userId }).lean();
  return !!r;
}

async function assertVersionOwner(
  versionId: string,
  userId: string
): Promise<{ version: { _id: Types.ObjectId; resume_id: Types.ObjectId; content_text: string; storage_path?: string | null; version_label: string; created_at?: Date } } | null> {
  if (!Types.ObjectId.isValid(versionId)) return null;
  const version = await ResumeVersion.findById(versionId).lean();
  if (!version) return null;
  const resume = await Resume.findOne({
    _id: version.resume_id,
    user_id: userId,
  }).lean();
  if (!resume) return null;
  return { version: version as typeof version & { _id: Types.ObjectId; resume_id: Types.ObjectId } };
}

router.post('/upload', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'file too large (max 10MB)' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message || 'upload rejected' });
      return;
    }
    next();
  });
}, async (req, res) => {
  try {
    const userId = req.user?.id as string;
    if (!userId) {
      res.status(401).json({ error: 'Missing user id' });
      return;
    }
    const rawTitle = (req.body.title as string) || req.file?.originalname || 'Untitled';
    const title = String(rawTitle).trim().slice(0, 200);
    const resumeDoc = await Resume.create({ user_id: userId, title });
    const resumeId = resumeDoc._id;
    let contentText = (req.body.text as string) || '';
    const storagePath = req.file?.path || null;
    if (!contentText && storagePath) {
      try {
        const buf = await fs.readFile(storagePath);
        const ext = path.extname(req.file?.originalname || '').toLowerCase();
        if (ext === '.pdf') {
          const pdf = await pdfParse(buf as Buffer);
          contentText = pdf.text || '';
        } else if (ext === '.docx') {
          const resM = await mammoth.extractRawText({ buffer: buf });
          contentText = resM.value || '';
        } else {
          contentText = buf.toString('utf8');
        }
      } catch (e) {
        log.warn({ e }, 'file extraction failed');
      }
    }
    const versionDoc = await ResumeVersion.create({
      resume_id: resumeId,
      version_label: 'original',
      content_text: contentText,
      storage_path: storagePath,
    });
    if (req.file?.path) {
      try { unlinkSync(req.file.path); } catch { /* ignore cleanup errors */ }
    }

    res.json({
      resumeId: resumeId.toString(),
      versionId: versionDoc._id.toString(),
    });
    trackEvent({
      userId,
      event: 'resume.upload',
      props: { chars: contentText.length, has_file: !!req.file },
    });
  } catch (err) {
    log.error({ err }, 'upload failed');
    res.status(500).json({ error: 'upload failed' });
  }
});

router.post('/create', requireAuth, express.json(), async (req, res) => {
  try {
    const userId = req.user?.id as string;
    if (!userId) {
      res.status(401).json({ error: 'Missing user id' });
      return;
    }
    const title = String(req.body.title || 'Untitled').trim().slice(0, 200);
    const text = String(req.body.text || '').slice(0, 100_000);
    const resumeDoc = await Resume.create({ user_id: userId, title });
    const versionDoc = await ResumeVersion.create({
      resume_id: resumeDoc._id,
      version_label: 'original',
      content_text: text,
      storage_path: null,
    });
    res.json({
      resumeId: resumeDoc._id.toString(),
      versionId: versionDoc._id.toString(),
    });
  } catch (e) {
    log.error({ e }, 'create failed');
    res.status(500).json({ error: 'create failed' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }
  const resumes = await Resume.find({ user_id: userId })
    .sort({ created_at: -1 })
    .lean();
  if (resumes.length === 0) {
    res.json([]);
    return;
  }
  const ids = resumes.map((r) => r._id);
  const countAgg = await ResumeVersion.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { resume_id: { $in: ids } } },
    { $group: { _id: '$resume_id', n: { $sum: 1 } } },
  ]);
  const countByResume = new Map(
    countAgg.map((c) => [String(c._id), c.n])
  );
  const list = resumes.map((r) => ({
    ...r,
    version_count: countByResume.get(String(r._id)) ?? 0,
  }));
  res.json(list);
});

router.get('/:resumeId/versions', requireAuth, async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user?.id as string;
  if (!Types.ObjectId.isValid(resumeId)) {
    badId(res);
    return;
  }
  const owned = await assertResumeOwner(resumeId, userId);
  if (!owned) {
    res.status(404).json({ error: 'resume not found' });
    return;
  }
  const r = await ResumeVersion.find({ resume_id: resumeId })
    .sort({ created_at: 1 })
    .lean();
  res.json(r);
});

router.delete('/:resumeId', requireAuth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user!.id as string;
    if (!Types.ObjectId.isValid(resumeId)) {
      badId(res);
      return;
    }
    const owned = await assertResumeOwner(resumeId, userId);
    if (!owned) {
      res.status(404).json({ error: 'resume not found' });
      return;
    }
    const versions = await ResumeVersion.find({ resume_id: resumeId })
      .select('_id')
      .lean();
    const versionIds = versions.map((v) => v._id);
    if (versionIds.length > 0) {
      await Feedback.deleteMany({ resume_version_id: { $in: versionIds } });
      await ResumeVersion.deleteMany({ _id: { $in: versionIds } });
    }
    await Resume.deleteOne({ _id: resumeId, user_id: userId });
    res.json({ ok: true });
    trackEvent({ userId, event: 'resume.delete', props: { resume_id: resumeId } });
  } catch (err) {
    log.error({ err }, 'delete failed');
    res.status(500).json({ error: 'delete failed' });
  }
});

router.post(
  '/versions/:versionId/feedback',
  requireAuth,
  express.json(),
  async (req, res) => {
    try {
      const { versionId } = req.params;
      const userId = req.user?.id as string;
      const owned = await assertVersionOwner(versionId, userId);
      if (!owned) {
        res.status(404).json({ error: 'version not found' });
        return;
      }
      const suggestions = req.body.suggestions;
      await Feedback.create({
        resume_version_id: versionId,
        author: 'user',
        suggestions,
      });
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'failed to save feedback' });
    }
  }
);

router.get(
  '/versions/:versionId/feedbacks',
  requireAuth,
  async (req, res) => {
    try {
      const { versionId } = req.params;
      const userId = req.user?.id as string;
      const owned = await assertVersionOwner(versionId, userId);
      if (!owned) {
        res.status(404).json({ error: 'version not found' });
        return;
      }
      const items = await Feedback.find({ resume_version_id: versionId })
        .sort({ created_at: 1 })
        .lean();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: 'failed to load feedbacks' });
    }
  }
);

router.post(
  '/versions/:versionId/process',
  requireAuth,
  express.json(),
  async (req, res) => {
    try {
      const { versionId } = req.params;
      const userId = req.user?.id as string;
      const canProcess = await hasFeature(userId, 'resume.ai_process');
      if (!canProcess) {
        res.status(403).json({ error: 'Plan insuffisant pour le traitement IA', code: 'UPGRADE_REQUIRED' });
        return;
      }
      const owned = await assertVersionOwner(versionId, userId);
      if (!owned) {
        res.status(404).json({ error: 'version not found' });
        return;
      }
      const { version } = owned;
      const analysis = await analyzeResume(version.content_text);

      const q = await consumeQuota(userId, 'resume_ai_process_runs_per_month');
      if (!q.allowed) {
        res.status(429).json({
          error: 'Quota mensuel atteint pour le traitement IA.',
          code: 'QUOTA_EXCEEDED',
          limit_key: 'resume_ai_process_runs_per_month',
        });
        return;
      }
      const improvedText =
        (analysis.parsed as { improved_text?: string })?.improved_text ||
        analysis.raw;
      const newVersionDoc = await ResumeVersion.create({
        resume_id: version.resume_id,
        version_label: 'improved',
        content_text: improvedText,
        storage_path: null,
      });
      await Feedback.create({
        resume_version_id: newVersionDoc._id,
        author: 'ai',
        suggestions: analysis.parsed,
      });
      res.json({
        ok: true,
        newVersionId: newVersionDoc._id.toString(),
        analysis: analysis.parsed,
      });
      trackEvent({
        userId,
        event: 'resume.ai_process',
        props: { source_version_id: versionId, new_version_id: newVersionDoc._id.toString() },
      });
    } catch (err) {
      log.error({ err }, 'processing failed');
      const message = err instanceof Error ? err.message : 'processing failed';
      const aiStatus = aiErrorStatus(err);
      if (aiStatus) {
        res.status(aiStatus).json({ error: message });
        return;
      }
      if (message.includes('OPENAI_API_KEY')) {
        res.status(503).json({ error: 'AI service not configured' });
        return;
      }
      res.status(500).json({ error: 'processing failed' });
    }
  }
);

router.post('/:resumeId/accept', requireAuth, express.json(), async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { versionId } = req.body as { versionId?: string };
    const userId = req.user?.id as string;
    if (!versionId || !Types.ObjectId.isValid(versionId)) {
      badId(res);
      return;
    }
    const resumeOwned = await assertResumeOwner(resumeId, userId);
    if (!resumeOwned) {
      res.status(404).json({ error: 'resume not found' });
      return;
    }
    const vo = await assertVersionOwner(versionId, userId);
    if (!vo) {
      res.status(404).json({ error: 'version not found' });
      return;
    }
    const version = vo.version;
    if (String(version.resume_id) !== resumeId) {
      res.status(400).json({ error: 'version does not belong to this resume' });
      return;
    }
    const finalDoc = await ResumeVersion.create({
      resume_id: resumeId,
      version_label: 'final',
      content_text: version.content_text,
      storage_path: version.storage_path,
    });
    await Feedback.create({
      resume_version_id: finalDoc._id,
      author: 'user',
      suggestions: { acceptedVersion: versionId },
    });
    res.json({ ok: true, finalVersionId: finalDoc._id.toString() });
  } catch (err) {
    log.error({ err }, 'accept failed');
    res.status(500).json({ error: 'accept failed' });
  }
});

router.post('/:resumeId/tailor', requireAuth, express.json(), async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { industry } = req.body as { industry?: string };
    const userId = req.user?.id as string;
    const canMatch = await hasFeature(userId, 'cv.job_match');
    if (!canMatch) {
      res.status(403).json({ error: 'Pro requis pour le mode tailoring', code: 'UPGRADE_REQUIRED' });
      return;
    }
    const resumeOwned = await assertResumeOwner(resumeId, userId);
    if (!resumeOwned) {
      res.status(404).json({ error: 'resume not found' });
      return;
    }
    const latest = await ResumeVersion.findOne({ resume_id: resumeId })
      .sort({ created_at: -1 })
      .lean();
    if (!latest) {
      res.status(404).json({ error: 'no versions found' });
      return;
    }
    const analysis = await analyzeResume(latest.content_text, { industry });

    const q = await consumeQuota(userId, 'cv_job_matches_per_month');
    if (!q.allowed) {
      res.status(429).json({
        error: 'Quota mensuel atteint pour le tailoring par secteur.',
        code: 'QUOTA_EXCEEDED',
        limit_key: 'cv_job_matches_per_month',
      });
      return;
    }
    await Feedback.create({
      resume_version_id: latest._id,
      author: 'ai',
      suggestions: {
        tailored_for: industry || null,
        analysis: analysis.parsed,
      },
    });
    res.json({ ok: true, analysis: analysis.parsed });
    } catch (err) {
      log.error({ err }, 'tailor failed');
      const message = err instanceof Error ? err.message : 'tailor failed';
    const aiStatus = aiErrorStatus(err);
    if (aiStatus) {
      res.status(aiStatus).json({ error: message });
      return;
    }
    if (message.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }
    res.status(500).json({ error: 'tailor failed' });
  }
});

router.get(
  '/versions/:versionId/download',
  requireAuth,
  async (req, res) => {
    try {
      const { versionId } = req.params;
      const userId = req.user?.id as string;
      const owned = await assertVersionOwner(versionId, userId);
      if (!owned) {
        res.status(404).json({ error: 'version not found' });
        return;
      }
      const version = await ResumeVersion.findById(versionId).lean();
      if (!version) {
        res.status(404).json({ error: 'version not found' });
        return;
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(version.content_text);
    } catch (err) {
      res.status(500).json({ error: 'download failed' });
    }
  }
);

export default router;
