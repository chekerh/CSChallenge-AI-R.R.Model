import express from 'express';
import pino from 'pino';
import JobAgent from '../models/JobAgent';
import JobApplication from '../models/JobApplication';
import { requireAuth } from '../middleware/authMiddleware';

const log = pino({ name: 'jobs' });
const router = express.Router();

// --- Job Agents ---

router.get('/agents', requireAuth, async (req, res) => {
  try {
    const agents = await JobAgent.find({ user_id: req.user!.id }).sort({ created_at: -1 }).lean();
    res.json(agents);
  } catch (err) {
    log.error({ err }, 'Failed to load agents');
    res.status(500).json({ error: 'Failed to load agents' });
  }
});

router.post('/agents', requireAuth, express.json(), async (req, res) => {
  try {
    const { name, keywords, location, schedule } = req.body as {
      name?: string; keywords?: string[]; location?: string; schedule?: string;
    };
    if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }
    if (name.trim().length > 200) { res.status(400).json({ error: 'name too long' }); return; }
    const agent = await JobAgent.create({
      user_id: req.user!.id,
      name: name.trim().slice(0, 200),
      keywords: (keywords || []).slice(0, 50),
      location: String(location || '').trim().slice(0, 200),
      schedule: schedule === 'weekly' ? 'weekly' : 'daily',
    });
    res.status(201).json(agent);
  } catch (err) {
    log.error({ err }, 'Failed to create agent');
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

router.patch('/agents/:id', requireAuth, express.json(), async (req, res) => {
  try {
    const agent = await JobAgent.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }
    const { name, enabled, keywords, location, schedule } = req.body as Record<string, unknown>;
    if (typeof name === 'string') agent.name = name;
    if (typeof enabled === 'boolean') agent.enabled = enabled;
    if (Array.isArray(keywords)) agent.keywords = keywords;
    if (typeof location === 'string') agent.location = location;
    if (typeof schedule === 'string') agent.schedule = schedule === 'weekly' ? 'weekly' : 'daily';
    agent.updated_at = new Date();
    await agent.save();
    res.json(agent);
  } catch (err) {
    log.error({ err }, 'Failed to update agent');
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

router.delete('/agents/:id', requireAuth, async (req, res) => {
  try {
    const agent = await JobAgent.findOneAndDelete({ _id: req.params.id, user_id: req.user!.id });
    if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Failed to delete agent');
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

router.post('/agents/:id/run', requireAuth, async (req, res) => {
  try {
    const agent = await JobAgent.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }
    agent.status = 'running';
    agent.updated_at = new Date();
    await agent.save();
    setTimeout(async () => {
      try {
        agent.last_run = new Date();
        agent.status = 'idle';
        agent.updated_at = new Date();
        await agent.save();
      } catch { /* ignore */ }
    }, 100);
    res.json({ ok: true, message: 'Agent triggered' });
  } catch (err) {
    log.error({ err }, 'Failed to run agent');
    res.status(500).json({ error: 'Failed to run agent' });
  }
});

// --- Job Applications ---

router.get('/applications', requireAuth, async (req, res) => {
  try {
    const apps = await JobApplication.find({ user_id: req.user!.id }).sort({ created_at: -1 }).lean();
    res.json(apps);
  } catch (err) {
    log.error({ err }, 'Failed to load applications');
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

router.post('/applications', requireAuth, express.json(), async (req, res) => {
  try {
    const { company, position, url, status, match_score, notes } = req.body as Record<string, unknown>;
    if (!company || !position) { res.status(400).json({ error: 'company and position required' }); return; }
    const app = await JobApplication.create({
      user_id: req.user!.id,
      company, position,
      url: typeof url === 'string' ? url : '',
      status: typeof status === 'string' ? status : 'saved',
      match_score: typeof match_score === 'number' ? match_score : undefined,
      notes: typeof notes === 'string' ? notes : '',
    });
    res.status(201).json(app);
  } catch (err) {
    log.error({ err }, 'Failed to create application');
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.patch('/applications/:id', requireAuth, express.json(), async (req, res) => {
  try {
    const app = await JobApplication.findOne({ _id: req.params.id, user_id: req.user!.id });
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
    const { company, position, url, status, match_score, notes } = req.body as Record<string, unknown>;
    if (typeof company === 'string') app.company = company;
    if (typeof position === 'string') app.position = position;
    if (typeof url === 'string') app.url = url;
    if (typeof status === 'string') {
      const s = status as 'saved' | 'applied' | 'interview' | 'rejected' | 'accepted';
      if (['saved', 'applied', 'interview', 'rejected', 'accepted'].includes(s)) app.status = s;
    }
    if (typeof match_score === 'number') app.match_score = match_score;
    if (typeof notes === 'string') app.notes = notes;
    if (status === 'applied' && !app.applied_date) app.applied_date = new Date();
    app.updated_at = new Date();
    await app.save();
    res.json(app);
  } catch (err) {
    log.error({ err }, 'Failed to update application');
    res.status(500).json({ error: 'Failed to update application' });
  }
});

router.delete('/applications/:id', requireAuth, async (req, res) => {
  try {
    const app = await JobApplication.findOneAndDelete({ _id: req.params.id, user_id: req.user!.id });
    if (!app) { res.status(404).json({ error: 'Application not found' }); return; }
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Failed to delete application');
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// --- Stats ---

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const [agents, apps] = await Promise.all([
      JobAgent.find({ user_id: userId }).lean(),
      JobApplication.find({ user_id: userId }).lean(),
    ]);
    res.json({
      total_agents: agents.length,
      active_agents: agents.filter(a => a.enabled).length,
      total_applications: apps.length,
      by_status: {
        saved: apps.filter(a => a.status === 'saved').length,
        applied: apps.filter(a => a.status === 'applied').length,
        interview: apps.filter(a => a.status === 'interview').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
      },
      average_score: apps.length > 0
        ? Math.round(apps.reduce((s, a) => s + (a.match_score || 0), 0) / apps.length)
        : 0,
    });
  } catch (err) {
    log.error({ err }, 'Failed to load stats');
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

export default router;
