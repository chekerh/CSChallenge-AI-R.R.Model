import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.use(requireAuth);

// List notifications (newest first, paginated via `before` cursor)
router.get('/', async (req, res) => {
  try {
    const userId = String(req.user?.id);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const before = req.query.before ? new Date(String(req.query.before)) : new Date();

    const notifications = await Notification.find({ user_id: userId, created_at: { $lt: before } })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    res.json({
      notifications,
      next_cursor: notifications.length === limit ? notifications[notifications.length - 1].created_at : null,
    });
  } catch (err) {
    console.error('list notifications failed:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = String(req.user?.id);
    const count = await Notification.countDocuments({ user_id: userId, read_at: null });
    res.json({ count });
  } catch (err) {
    console.error('unread count failed:', err);
    res.status(500).json({ error: 'Failed to load unread count' });
  }
});

// Mark one notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const userId = String(req.user?.id);
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'invalid notification id' });
      return;
    }
    const updated = await Notification.findOneAndUpdate(
      { _id: id, user_id: userId, read_at: null },
      { read_at: new Date() },
      { new: true },
    );
    if (!updated) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('mark notification read failed:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.post('/read-all', async (req, res) => {
  try {
    const userId = String(req.user?.id);
    await Notification.updateMany({ user_id: userId, read_at: null }, { read_at: new Date() });
    res.json({ ok: true });
  } catch (err) {
    console.error('mark all read failed:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
