import express from 'express';
import pino from 'pino';
import { requireAuth } from '../middleware/authMiddleware';

const log = pino({ name: 'kaggle' });
const router = express.Router();

router.get('/datasets', requireAuth, async (_req, res) => {
  try {
    const user = process.env.KAGGLE_USERNAME;
    const key = process.env.KAGGLE_KEY;
    if (!user || !key) {
      res.status(503).json({ error: 'kaggle credentials not configured' });
      return;
    }
    const auth =
      'Basic ' + Buffer.from(`${user}:${key}`).toString('base64');
    const url =
      'https://www.kaggle.com/api/v1/datasets/list?search=resume+cv+job&file_type=csv';
    const r = await fetch(url, { headers: { Authorization: auth } });
    if (!r.ok) {
      res
        .status(502)
        .json({ error: 'kaggle fetch failed', status: r.status });
      return;
    }
    const data = (await r.json()) as unknown[];
    res.json({ ok: true, datasets: (data || []).slice(0, 10) });
  } catch (err) {
    log.error({ err }, 'kaggle proxy failed');
    res.status(500).json({ error: 'kaggle proxy failed' });
  }
});

export default router;
