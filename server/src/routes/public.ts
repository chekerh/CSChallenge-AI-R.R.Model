import express from 'express';
import Plan from '../models/Plan';
import ContentBlock from '../models/ContentBlock';
import pino from 'pino';

const log = pino({ name: 'public' });

const router = express.Router();

router.get('/plans', async (_req, res) => {
  try {
    const plans = await Plan.find({ is_public: true })
      .select('code name description currency price_monthly features limits sort_order')
      .sort({ sort_order: 1, created_at: 1 })
      .lean();
    res.json(plans);
  } catch (err) {
    log.error({ err }, 'GET /public/plans failed');
    res.status(500).json({ error: 'failed to load plans' });
  }
});

router.get('/content/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const block = await ContentBlock.findOne({ key }).lean();
    if (!block) {
      res.status(404).json({ error: 'content block not found' });
      return;
    }
    const b = block as { status?: string; content?: unknown; published_content?: unknown; updated_at?: Date; published_at?: Date };
    const content = b.status === 'published' ? (b.published_content ?? b.content ?? {}) : (b.content ?? {});
    res.json({
      key,
      status: b.status || 'draft',
      content,
      updated_at: b.updated_at,
      published_at: b.published_at || null,
    });
  } catch (err) {
    log.error({ err }, 'GET /public/content/:key failed');
    res.status(500).json({ error: 'failed to load content' });
  }
});

export default router;

