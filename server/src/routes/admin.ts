import express from 'express';
import User from '../models/User';
import AdminSetting from '../models/AdminSetting';
import ContentBlock from '../models/ContentBlock';
import AuditLog from '../models/AuditLog';
import Plan from '../models/Plan';
import UsageCounter from '../models/UsageCounter';
import Event from '../models/Event';
import Resume from '../models/Resume';
import SystemError from '../models/SystemError';
import Incident from '../models/Incident';
import SelfHealAction from '../models/SelfHealAction';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole, type AppRole } from '../middleware/requireRole';
import { getWorkerStatus, runManualHealCycle, getAlertSettings } from '../services/monitoring';
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

const monitoringRouter = express.Router();

async function monitoringOverview() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since1h = new Date(now.getTime() - 60 * 60 * 1000);

  const [errors24h, errors1h, openIncidents, openCritical, heal24h, events24h, logins24h, signups24h, recentIncidents, recentErrors] =
    await Promise.all([
      SystemError.countDocuments({ created_at: { $gte: since24h } }),
      SystemError.countDocuments({ created_at: { $gte: since1h } }),
      Incident.countDocuments({ status: 'open' }),
      Incident.countDocuments({ status: 'open', severity: 'critical' }),
      SelfHealAction.countDocuments({ created_at: { $gte: since24h } }),
      Event.countDocuments({ created_at: { $gte: since24h } }),
      Event.countDocuments({ created_at: { $gte: since24h }, event: 'user.login' }),
      Event.countDocuments({ created_at: { $gte: since24h }, event: 'user.signup' }),
      Incident.find({}).sort({ last_seen_at: -1 }).limit(5).lean(),
      SystemError.find({}).sort({ created_at: -1 }).limit(5).lean(),
    ]);

  return {
    now: now.toISOString(),
    errors_24h: errors24h,
    errors_1h: errors1h,
    open_incidents: openIncidents,
    open_critical: openCritical,
    heal_actions_24h: heal24h,
    events_24h: events24h,
    logins_24h: logins24h,
    signups_24h: signups24h,
    recent_incidents: recentIncidents,
    recent_errors: recentErrors,
    worker: getWorkerStatus(),
    alerts: await getAlertSettings(),
  };
}

monitoringRouter.get('/overview', async (req, res) => {
  try {
    res.json(await monitoringOverview());
  } catch (err) {
    log.error({ err }, 'GET /admin/monitoring/overview failed');
    res.status(500).json({ error: 'failed to load monitoring overview' });
  }
});

monitoringRouter.get('/events', async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const events = await Event.find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .select('event props user_id created_at')
      .lean();
    res.json(events);
  } catch (err) {
    log.error({ err }, 'GET /admin/monitoring/events failed');
    res.status(500).json({ error: 'failed to load events' });
  }
});

monitoringRouter.get('/errors', async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const errors = await SystemError.find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    res.json(errors);
  } catch (err) {
    log.error({ err }, 'GET /admin/monitoring/errors failed');
    res.status(500).json({ error: 'failed to load errors' });
  }
});

monitoringRouter.get('/incidents', async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const incidents = await Incident.find({})
      .sort({ last_seen_at: -1 })
      .limit(limit)
      .lean();
    res.json(incidents);
  } catch (err) {
    log.error({ err }, 'GET /admin/monitoring/incidents failed');
    res.status(500).json({ error: 'failed to load incidents' });
  }
});

monitoringRouter.get('/metrics', async (req, res) => {
  try {
    const minutes = Math.min(1440, Math.max(10, Number(req.query.minutes) || 60));
    const bucketSize = Math.max(1, Math.round(minutes / 60));
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const now = new Date();
    const buckets: { t: string; errors: number; events: number }[] = [];

    const [errorDocs, eventDocs] = await Promise.all([
      SystemError.find({ created_at: { $gte: since } }).select('created_at').lean(),
      Event.find({ created_at: { $gte: since } }).select('created_at').lean(),
    ]);

    const start = since.getTime();
    const step = bucketSize * 60 * 1000;
    const count = Math.ceil((now.getTime() - start) / step);
    const errorsByBucket = new Map<number, number>();
    const eventsByBucket = new Map<number, number>();
    for (const d of errorDocs) {
      const b = Math.floor(((d.created_at as Date).getTime() - start) / step);
      errorsByBucket.set(b, (errorsByBucket.get(b) || 0) + 1);
    }
    for (const d of eventDocs) {
      const b = Math.floor(((d.created_at as Date).getTime() - start) / step);
      eventsByBucket.set(b, (eventsByBucket.get(b) || 0) + 1);
    }
    for (let i = 0; i < count; i++) {
      buckets.push({
        t: new Date(start + i * step).toISOString(),
        errors: errorsByBucket.get(i) || 0,
        events: eventsByBucket.get(i) || 0,
      });
    }
    res.json({ minutes, bucket_size_seconds: step / 1000, buckets });
  } catch (err) {
    log.error({ err }, 'GET /admin/monitoring/metrics failed');
    res.status(500).json({ error: 'failed to load metrics' });
  }
});

monitoringRouter.get('/self-heal', async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const actions = await SelfHealAction.find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
    res.json(actions);
  } catch (err) {
    log.error({ err }, 'GET /admin/monitoring/self-heal failed');
    res.status(500).json({ error: 'failed to load self-heal log' });
  }
});

monitoringRouter.post('/self-heal/run', async (req, res) => {
  try {
    const result = await runManualHealCycle();
    audit(req, 'admin.monitoring.self_heal_run', { type: 'Monitoring' }, result);
    res.json({ ...result, worker: getWorkerStatus() });
  } catch (err) {
    log.error({ err }, 'POST /admin/monitoring/self-heal/run failed');
    res.status(500).json({ error: 'failed to run self-heal cycle' });
  }
});

monitoringRouter.post('/incidents/:id/resolve', async (req, res) => {
  try {
    const inc = await Incident.findById(req.params.id).lean();
    if (!inc) {
      res.status(404).json({ error: 'incident not found' });
      return;
    }
    await Incident.updateOne(
      { _id: inc._id },
      { $set: { status: 'manual_resolved', resolved_at: new Date(), resolved_by: 'admin', resolved_by_user: req.user!.id } }
    );
    await SelfHealAction.create({
      incident_id: inc._id,
      action: 'manual_resolve',
      status: 'success',
      detail: `Incident « ${inc.title} » clôturé manuellement par un administrateur.`,
      triggered_by: 'admin',
    });
    audit(req, 'admin.monitoring.incident_resolve', { type: 'Incident', id: String(inc._id) });
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'POST /admin/monitoring/incidents/:id/resolve failed');
    res.status(500).json({ error: 'failed to resolve incident' });
  }
});

router.use('/monitoring', monitoringRouter);

export default router;

