import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Simple Kaggle dataset metadata proxy. Requires KAGGLE_USERNAME and KAGGLE_KEY in env.
router.get('/datasets', async (req, res) => {
  try {
    const user = process.env.KAGGLE_USERNAME;
    const key = process.env.KAGGLE_KEY;
    if (!user || !key) return res.status(500).json({ error: 'kaggle credentials not configured' });
    const auth = 'Basic ' + Buffer.from(`${user}:${key}`).toString('base64');
    // Kaggle's API endpoints are not always public; this attempts to use the datasets list endpoint
    const url = 'https://www.kaggle.com/api/v1/datasets/list?search=resume+cv+job&file_type=csv';
    const r = await fetch(url, { headers: { Authorization: auth } });
    if (!r.ok) return res.status(502).json({ error: 'kaggle fetch failed', status: r.status });
    const data = await r.json();
    res.json({ ok: true, datasets: (data || []).slice(0, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
