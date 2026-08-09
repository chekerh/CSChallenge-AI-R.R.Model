import express from 'express';
import User from '../models/User';
import AdminSetting from '../models/AdminSetting';
import ContentBlock from '../models/ContentBlock';
import AuditLog from '../models/AuditLog';
import Plan from '../models/Plan';
import UsageCounter from '../models/UsageCounter';
import Event from '../models/Event';
import Resume from '../models/Resume';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole, type AppRole } from '../middleware/requireRole';
import pino from 'pino';

const log = pino({ name: 'admin' });

const router = express.Router();

function audit(req: express.Request, action: string, target?: { type?: string; id?: string }, metadata?: unknown) {
  const actorId = req.user?.id;
  const actorRole = req.user?.role ?? 'user';
  if (!actorId) return;
  void AuditLog.create({
    actor_user_id: actorId,
    actor_role: actorRole,
    action,
    target_type: target?.type,
    target_id: target?.id,
    metadata,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
  });
}

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/me', async (req, res) => {
  try {
    const u = await User.findById(req.user!.id).select('email name role plan created_at').lean();
    if (!u) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    res.json(u);
  } catch (err) {
    log.error({ err }, 'GET /admin/me failed');
    res.status(500).json({ error: 'failed to load admin profile' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const filter = q ? { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {};
    const users = await User.find(filter)
      .select('email name role plan created_at')
      .sort({ created_at: -1 })
      .limit(200)
      .lean();
    res.json(users);
  } catch (err) {
    log.error({ err }, 'GET /admin/users failed');
    res.status(500).json({ error: 'failed to load users' });
  }
});

router.patch('/users/:id', express.json(), async (req, res) => {
  try {
    const actorRole = (req.user?.role ?? 'user') as AppRole;
    const updates: Record<string, unknown> = {};
    const body = req.body as { plan?: string; role?: string };

    if (body.plan && (body.plan === 'free' || body.plan === 'pro')) {
      updates.plan = body.plan;
    }
    if (body.role && ['user', 'support', 'admin', 'super_admin'].includes(body.role)) {
      if (actorRole !== 'super_admin') {
        res.status(403).json({ error: 'role changes require super_admin' });
        return;
      }
      updates.role = body.role;
    }

    if (!Object.keys(updates).length) {
      res.status(400).json({ error: 'no valid updates' });
      return;
    }

    const u = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
      .select('email name role plan created_at')
      .lean();
    if (!u) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    audit(req, 'admin.user.update', { type: 'User', id: req.params.id }, { updates });
    res.json(u);
  } catch (err) {
    log.error({ err }, 'PATCH /admin/users/:id failed');
    res.status(500).json({ error: 'failed to update user' });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const items = await AdminSetting.find({}).sort({ key: 1 }).lean();
    res.json(items);
  } catch (err) {
    log.error({ err }, 'GET /admin/settings failed');
    res.status(500).json({ error: 'failed to load settings' });
  }
});

router.get('/plans', async (_req, res) => {
  try {
    const items = await Plan.find({}).sort({ sort_order: 1, created_at: 1 }).lean();
    res.json(items);
  } catch (err) {
    log.error({ err }, 'GET /admin/plans failed');
    res.status(500).json({ error: 'failed to load plans' });
  }
});

router.patch('/plans/:code', express.json(), async (req, res) => {
  try {
    const code = req.params.code;
    const body = req.body as {
      name?: string;
      description?: string;
      price_monthly?: number;
      currency?: string;
      is_public?: boolean;
      sort_order?: number;
      features?: string[];
      limits?: unknown;
    };
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (typeof body.name === 'string') updates.name = body.name;
    if (typeof body.description === 'string') updates.description = body.description;
    if (typeof body.price_monthly === 'number' && Number.isFinite(body.price_monthly)) {
      updates.price_monthly = Math.max(0, body.price_monthly);
    }
    if (typeof body.currency === 'string' && body.currency.trim()) updates.currency = body.currency.trim().toUpperCase();
    if (typeof body.is_public === 'boolean') updates.is_public = body.is_public;
    if (typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)) updates.sort_order = body.sort_order;
    if (Array.isArray(body.features)) updates.features = body.features.filter((x) => typeof x === 'string');
    if (body.limits && typeof body.limits === 'object') updates.limits = body.limits;

    const defaults = {
      code,
      name: code === 'pro' ? 'Pro' : 'Free',
      description: '',
      currency: 'TND',
      price_monthly: code === 'pro' ? 39 : 0,
      is_public: true,
      sort_order: code === 'pro' ? 2 : 1,
      features: code === 'pro' ? ['resume.ai_process', 'cv.job_match', 'cv.rewrite_section', 'cv.diagnosis.full'] : ['resume.ai_process'],
      limits:
        code === 'pro'
          ? {
              cv_diagnosis_runs_per_month: 500,
              cv_job_matches_per_month: 300,
              cv_rewrite_sections_per_month: 300,
              resume_ai_process_runs_per_month: 500,
            }
          : {
              cv_diagnosis_runs_per_month: 20,
              cv_job_matches_per_month: 0,
              cv_rewrite_sections_per_month: 0,
              resume_ai_process_runs_per_month: 20,
            },
    };

    const doc = await Plan.findOneAndUpdate(
      { code },
      { ...defaults, ...updates },
      { upsert: true, new: true }
    ).lean();
    audit(req, 'admin.plan.upsert', { type: 'Plan', id: code }, { updates: Object.keys(updates) });
    res.json(doc);
  } catch (err) {
    log.error({ err }, 'PATCH /admin/plans/:code failed');
    res.status(500).json({ error: 'failed to update plan' });
  }
});

router.patch('/settings/:key', express.json(), async (req, res) => {
  try {
    const key = req.params.key;
    const body = req.body as { type?: string; value?: unknown; validation?: unknown };
    if (!body.type || !['string', 'number', 'boolean', 'json'].includes(body.type)) {
      res.status(400).json({ error: 'invalid type' });
      return;
    }
    if (!('value' in body)) {
      res.status(400).json({ error: 'missing value' });
      return;
    }
    const doc = await AdminSetting.findOneAndUpdate(
      { key },
      { key, type: body.type, value: body.value, validation: body.validation, updated_by: req.user!.id, updated_at: new Date() },
      { upsert: true, new: true }
    ).lean();
    audit(req, 'admin.setting.update', { type: 'AdminSetting', id: key }, { type: body.type });
    res.json(doc);
  } catch (err) {
    log.error({ err }, 'PATCH /admin/settings/:key failed');
    res.status(500).json({ error: 'failed to update setting' });
  }
});

router.get('/content', async (_req, res) => {
  try {
    const blocks = await ContentBlock.find({}).sort({ key: 1 }).lean();
    res.json(blocks);
  } catch (err) {
    log.error({ err }, 'GET /admin/content failed');
    res.status(500).json({ error: 'failed to load content' });
  }
});

router.patch('/content/:key', express.json(), async (req, res) => {
  try {
    const key = req.params.key;
    const content = (req.body as { content?: unknown }).content;
    const doc = await ContentBlock.findOneAndUpdate(
      { key },
      { key, status: 'draft', content, updated_by: req.user!.id, updated_at: new Date() },
      { upsert: true, new: true }
    ).lean();
    audit(req, 'admin.content.update_draft', { type: 'ContentBlock', id: key });
    res.json(doc);
  } catch (err) {
    log.error({ err }, 'PATCH /admin/content/:key failed');
    res.status(500).json({ error: 'failed to update content' });
  }
});

router.post('/content/:key/publish', async (req, res) => {
  try {
    const key = req.params.key;
    const existing = await ContentBlock.findOne({ key }).lean();
    if (!existing) {
      res.status(404).json({ error: 'content block not found' });
      return;
    }
    const doc = await ContentBlock.findOneAndUpdate(
      { key },
      { status: 'published', published_content: (existing as { content?: unknown }).content, published_at: new Date(), updated_by: req.user!.id, updated_at: new Date() },
      { new: true }
    ).lean();
    audit(req, 'admin.content.publish', { type: 'ContentBlock', id: key });
    res.json(doc);
  } catch (err) {
    log.error({ err }, 'POST /admin/content/:key/publish failed');
    res.status(500).json({ error: 'failed to publish content' });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const items = await AuditLog.find({})
      .sort({ created_at: -1 })
      .limit(200)
      .lean();
    audit(req, 'admin.audit.view');
    res.json(items);
  } catch (err) {
    log.error({ err }, 'GET /admin/audit failed');
    res.status(500).json({ error: 'failed to load audit log' });
  }
});

router.get('/usage/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const items = await UsageCounter.find({ user_id: userId })
      .sort({ period_key: -1 })
      .limit(6)
      .lean();
    audit(req, 'admin.usage.view', { type: 'UsageCounter', id: userId });
    res.json(items);
  } catch (err) {
    log.error({ err }, 'GET /admin/usage/:userId failed');
    res.status(500).json({ error: 'failed to load usage' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [users30, users7, resumes30, events30, topEvents] = await Promise.all([
      User.countDocuments({ created_at: { $gte: since30d } }),
      User.countDocuments({ created_at: { $gte: since7d } }),
      Resume.countDocuments({ created_at: { $gte: since30d } }),
      Event.countDocuments({ created_at: { $gte: since30d } }),
      Event.aggregate<{ _id: string; n: number }>([
        { $match: { created_at: { $gte: since30d } } },
        { $group: { _id: '$event', n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 12 },
      ]),
    ]);

    audit(req, 'admin.analytics.view');
    res.json({
      window_days: 30,
      signups_30d: users30,
      signups_7d: users7,
      resumes_created_30d: resumes30,
      total_events_30d: events30,
      top_events_30d: topEvents,
    });
  } catch (err) {
    log.error({ err }, 'GET /admin/analytics failed');
    res.status(500).json({ error: 'failed to load analytics' });
  }
});

export default router;

