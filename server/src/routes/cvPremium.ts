import express from 'express';
import pino from 'pino';
import { compileProfileToPlainText } from '@utopiahire/shared';
import { requireAuth } from '../middleware/authMiddleware';

const log = pino({ name: 'cv-premium' });
import {
  assertOutputLanguage,
  assertTargetRole,
  runDeepDiagnosis,
  runJobMatch,
  runRewriteSection,
  truncateDiagnosisForFree,
} from '../cv/engine';
import { parseBody, cvDiagnosisBodySchema, cvRewriteBodySchema, cvJobMatchBodySchema, cvBuilderDraftBodySchema, cvBuilderPublishBodySchema } from '../cv/validation';
import { loadUserPlan } from '../cv/userPlan';
import { consumeQuota, hasFeature } from '../billing/entitlements';
import CvAnalysis from '../models/CvAnalysis';
import CvBuilderDraft from '../models/CvBuilderDraft';
import Resume from '../models/Resume';
import ResumeVersion from '../models/ResumeVersion';
import { trackEvent } from '../analytics/events';

const router = express.Router();

const UPGRADE_FR =
  'Passez à **Pro** pour : diagnostic complet (tous les scores et sections), comparaison aux offres d’emploi, et réécritures triple ton.';

function validationErr(e: unknown, res: express.Response): void {
  const msg = e instanceof Error ? e.message : 'invalid body';
  res.status(400).json({ error: msg.startsWith('Validation:') ? msg : `Validation: ${msg}` });
}

router.post('/diagnosis', requireAuth, async (req, res) => {
  try {
    const body = parseBody(cvDiagnosisBodySchema, req.body);
    if (!assertTargetRole(body.targetRole)) {
      res.status(400).json({ error: 'invalid targetRole' });
      return;
    }
    const outputLang = body.outputLanguage || 'fr';
    if (!assertOutputLanguage(outputLang)) {
      res.status(400).json({ error: 'invalid outputLanguage' });
      return;
    }
    const userId = req.user!.id;
    const plan = await loadUserPlan(userId);
    const full = await runDeepDiagnosis(body.text, outputLang, body.targetRole);

    const q = await consumeQuota(userId, 'cv_diagnosis_runs_per_month');
    if (!q.allowed) {
      res.status(429).json({
        error: 'Quota mensuel atteint pour le diagnostic CV.',
        code: 'QUOTA_EXCEEDED',
        limit_key: 'cv_diagnosis_runs_per_month',
      });
      return;
    }

    const doc = await CvAnalysis.create({
      user_id: userId,
      target_role: body.targetRole,
      output_language: body.outputLanguage,
      input_char_count: body.text.length,
      full_diagnosis: full,
      tier_at_request: plan,
    });

    const truncated = plan === 'free';
    const diagnosis = truncated ? truncateDiagnosisForFree(full) : full;

    res.json({
      diagnosis,
      tier: plan,
      truncated,
      upgrade_message: truncated ? UPGRADE_FR : undefined,
      analysis_id: doc._id.toString(),
    });
    trackEvent({
      userId,
      event: 'cv.diagnosis',
      props: { tier: plan, truncated, input_chars: body.text.length },
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Validation:')) {
      validationErr(e, res);
      return;
    }
    const msg = e instanceof Error ? e.message : 'diagnosis failed';
    if (msg.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }
    if (msg.includes('required') || msg.includes('exceeds')) {
      res.status(400).json({ error: msg });
      return;
    }
    log.error({ err: e }, 'diagnosis failed');
    res.status(500).json({ error: 'diagnosis failed' });
  }
});

router.post('/rewrite-section', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const canRewrite = await hasFeature(userId, 'cv.rewrite_section');
    if (!canRewrite) {
      res.status(403).json({
        error: 'Pro requis pour la réécriture IA triple ton.',
        code: 'UPGRADE_REQUIRED',
      });
      return;
    }
    const body = parseBody(cvRewriteBodySchema, req.body);
    const result = await runRewriteSection({
      sectionType: body.sectionType,
      sectionText: body.sectionText,
      outputLanguage: body.outputLanguage || 'fr',
      targetRole: body.targetRole,
    });

    const q = await consumeQuota(userId, 'cv_rewrite_sections_per_month');
    if (!q.allowed) {
      res.status(429).json({
        error: 'Quota mensuel atteint pour la réécriture de section.',
        code: 'QUOTA_EXCEEDED',
        limit_key: 'cv_rewrite_sections_per_month',
      });
      return;
    }
    res.json(result);
    trackEvent({
      userId,
      event: 'cv.rewrite_section',
      props: { section_type: body.sectionType, output_language: body.outputLanguage },
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Validation:')) {
      validationErr(e, res);
      return;
    }
    const msg = e instanceof Error ? e.message : 'rewrite failed';
    if (msg.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }
    if (msg.includes('required') || msg.includes('exceeds')) {
      res.status(400).json({ error: msg });
      return;
    }
    log.error({ err: e }, 'rewrite failed');
    res.status(500).json({ error: 'rewrite failed' });
  }
});

router.post('/job-match', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const canMatch = await hasFeature(userId, 'cv.job_match');
    if (!canMatch) {
      res.status(403).json({
        error: 'Pro requis pour la comparaison CV ↔ offre.',
        code: 'UPGRADE_REQUIRED',
      });
      return;
    }
    const body = parseBody(cvJobMatchBodySchema, req.body);
    const result = await runJobMatch(
      body.text,
      body.jobDescription,
      body.outputLanguage || 'fr',
      body.targetRole
    );

    const q = await consumeQuota(userId, 'cv_job_matches_per_month');
    if (!q.allowed) {
      res.status(429).json({
        error: 'Quota mensuel atteint pour la comparaison CV ↔ offre.',
        code: 'QUOTA_EXCEEDED',
        limit_key: 'cv_job_matches_per_month',
      });
      return;
    }
    res.json(result);
    trackEvent({
      userId,
      event: 'cv.job_match',
      props: { output_language: body.outputLanguage, target_role: body.targetRole },
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Validation:')) {
      validationErr(e, res);
      return;
    }
    const msg = e instanceof Error ? e.message : 'job match failed';
    if (msg.includes('OPENAI_API_KEY')) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }
    if (msg.includes('required') || msg.includes('exceeds')) {
      res.status(400).json({ error: msg });
      return;
    }
    log.error({ err: e }, 'job match failed');
    res.status(500).json({ error: 'job match failed' });
  }
});

router.get('/builder/draft', requireAuth, async (req, res) => {
  try {
    const d = await CvBuilderDraft.findOne({ user_id: req.user!.id }).lean();
    if (!d) {
      res.json({ draft: null });
      return;
    }
    res.json({
      draft: {
        title: d.title,
        profile: d.profile,
        compiled_text: d.compiled_text,
        updated_at: d.updated_at,
      },
    });
  } catch (e) {
    log.error({ err: e }, 'failed to load draft');
    res.status(500).json({ error: 'failed to load draft' });
  }
});

router.post('/builder/draft', requireAuth, async (req, res) => {
  try {
    const body = parseBody(cvBuilderDraftBodySchema, req.body);
    const compiled = compileProfileToPlainText(body.profile as Parameters<typeof compileProfileToPlainText>[0]);
    if (!compiled.trim()) {
      res.status(400).json({ error: 'Le CV compilé est vide — remplissez au moins une section.' });
      return;
    }
    await CvBuilderDraft.findOneAndUpdate(
      { user_id: req.user!.id },
      {
        $set: {
          title: body.title?.trim() || 'Mon CV',
          profile: body.profile,
          compiled_text: compiled,
          updated_at: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    res.json({ ok: true, compiled_text: compiled });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Validation:')) {
      validationErr(e, res);
      return;
    }
    log.error({ err: e }, 'failed to save draft');
    res.status(500).json({ error: 'failed to save draft' });
  }
});

router.post('/builder/publish', requireAuth, async (req, res) => {
  try {
    const body = parseBody(cvBuilderPublishBodySchema, req.body);
    const compiled = compileProfileToPlainText(body.profile as Parameters<typeof compileProfileToPlainText>[0]);
    if (!compiled.trim()) {
      res.status(400).json({ error: 'Le CV compilé est vide.' });
      return;
    }
    const userId = req.user!.id;
    const title = body.title?.trim() || 'CV (créateur)';
    const resumeDoc = await Resume.create({ user_id: userId, title });
    const versionDoc = await ResumeVersion.create({
      resume_id: resumeDoc._id,
      version_label: 'original',
      content_text: compiled,
      storage_path: null,
    });
    await CvBuilderDraft.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          title,
          profile: body.profile,
          compiled_text: compiled,
          updated_at: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    res.json({
      ok: true,
      resumeId: resumeDoc._id.toString(),
      versionId: versionDoc._id.toString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Validation:')) {
      validationErr(e, res);
      return;
    }
    log.error({ err: e }, 'publish failed');
    res.status(500).json({ error: 'publish failed' });
  }
});

export default router;
