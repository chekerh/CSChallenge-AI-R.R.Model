import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { analyzeResume } from '../openai';
import { requireAuth } from '../middleware/authMiddleware';
import Resume from '../models/Resume';
import ResumeVersion from '../models/ResumeVersion';
import Feedback from '../models/Feedback';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Upload a resume file and create resume + original version
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
  // @ts-ignore
  const userId = req.user?.id as string;
  if (!userId) return res.status(401).json({ error: 'Missing user id' });
  const title = (req.body.title as string) || req.file?.originalname || 'Untitled';
  const resumeDoc = await Resume.create({ user_id: userId, title });
  const resumeId = resumeDoc._id;
  let contentText = req.body.text || '';
  const storagePath = req.file?.path || null;
  // if no text provided but a file exists, try to extract text based on file type
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
        // fallback: try to decode as utf-8 text
        contentText = buf.toString('utf8');
      }
    } catch (e) {
      console.warn('file extraction failed', e);
    }
  }
  const versionDoc = await ResumeVersion.create({ resume_id: resumeId, version_label: 'original', content_text: contentText, storage_path: storagePath });
  res.json({ resumeId: resumeId.toString(), versionId: versionDoc._id.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'upload failed' });
  }
});

// Create a resume from JSON body (text-only flow) -- useful for tests and clients that send JSON
router.post('/create', requireAuth, express.json(), async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!userId) return res.status(401).json({ error: 'Missing user id' });
    const title = (req.body.title as string) || 'Untitled';
    const text = (req.body.text as string) || '';
    const resumeDoc = await Resume.create({ user_id: userId, title });
    const versionDoc = await ResumeVersion.create({ resume_id: resumeDoc._id, version_label: 'original', content_text: text, storage_path: null });
    res.json({ resumeId: resumeDoc._id.toString(), versionId: versionDoc._id.toString() });
  } catch (e) {
    console.error(e);
    
    res.status(500).json({ error: 'create failed' });
  }
});

// Get resume versions
router.get('/:resumeId/versions', async (req, res) => {
  const { resumeId } = req.params;
  const r = await ResumeVersion.find({ resume_id: resumeId }).sort({ created_at: 1 }).lean();
  res.json(r);
});

// List resumes for authenticated user
router.get('/', requireAuth, async (req, res) => {
  // @ts-ignore
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'not authenticated' });
  const list = await Resume.find({ user_id: userId }).lean();
  res.json(list);
});

// Add feedback record
router.post('/versions/:versionId/feedback', express.json(), async (req, res) => {
  try {
    const { versionId } = req.params;
    const suggestions = req.body.suggestions;
    await Feedback.create({ resume_version_id: versionId, author: 'ai', suggestions });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to save feedback' });
  }
});

// Get feedbacks for a version
router.get('/versions/:versionId/feedbacks', async (req, res) => {
  try {
    const { versionId } = req.params;
    const items = await Feedback.find({ resume_version_id: versionId }).sort({ created_at: 1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'failed to load feedbacks' });
  }
});

// Process a resume version with OpenAI, store improved version and feedback
router.post('/versions/:versionId/process', express.json(), async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = await ResumeVersion.findById(versionId).lean();
    if (!version) return res.status(404).json({ error: 'version not found' });
    const analysis = await analyzeResume(version.content_text);
    const improvedText = analysis.parsed?.improved_text || analysis.raw;
    const newVersionDoc = await ResumeVersion.create({ resume_id: version.resume_id, version_label: 'improved', content_text: improvedText, storage_path: null });
    await Feedback.create({ resume_version_id: newVersionDoc._id, author: 'ai', suggestions: analysis.parsed });
    res.json({ ok: true, newVersionId: newVersionDoc._id.toString(), analysis: analysis.parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'processing failed' });
  }
});

// Accept a version and create a 'final' version (user accepts AI improvements)
router.post('/:resumeId/accept', express.json(), requireAuth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { versionId } = req.body as { versionId: string };
    const version = await ResumeVersion.findById(versionId).lean();
    if (!version) return res.status(404).json({ error: 'version not found' });
    const finalDoc = await ResumeVersion.create({ resume_id: resumeId, version_label: 'final', content_text: version.content_text, storage_path: version.storage_path });
    await Feedback.create({ resume_version_id: finalDoc._id, author: 'user', suggestions: { acceptedVersion: versionId } });
    res.json({ ok: true, finalVersionId: finalDoc._id.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'accept failed' });
  }
});

// Tailor suggestions for a resume (industry-specific)
router.post('/:resumeId/tailor', express.json(), requireAuth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { industry } = req.body as { industry?: string };
    // find latest version
    const latest = await ResumeVersion.findOne({ resume_id: resumeId }).sort({ created_at: -1 }).lean();
    if (!latest) return res.status(404).json({ error: 'no versions found' });
    const analysis = await analyzeResume(latest.content_text, { industry });
    // store tailored feedback without creating a new version
    await Feedback.create({ resume_version_id: latest._id, author: 'ai', suggestions: { tailored_for: industry || null, analysis: analysis.parsed } });
    res.json({ ok: true, analysis: analysis.parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'tailor failed' });
  }
});

// Download a version's text
router.get('/versions/:versionId/download', async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = await ResumeVersion.findById(versionId).lean();
    if (!version) return res.status(404).json({ error: 'version not found' });
    res.setHeader('Content-Type', 'text/plain');
    res.send(version.content_text);
  } catch (err) {
    res.status(500).json({ error: 'download failed' });
  }
});

export default router;
