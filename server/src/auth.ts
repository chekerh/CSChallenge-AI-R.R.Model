import './config/env';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User';
import { requireAuth } from './middleware/authMiddleware';
import { getJwtSecret } from './config/env';

const router = express.Router();

// Allow single-label domains (e.g. user@local) for dev/smoke; still require @ and non-empty local/domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;

router.post('/signup', express.json(), async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email and password required' });
      return;
    }
    const normalized = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      res.status(400).json({ error: 'invalid email' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'password must be at least 8 characters' });
      return;
    }
    const existing = await User.findOne({ email: normalized }).lean();
    if (existing) {
      res.status(409).json({ error: 'email already registered' });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalized,
      name: name?.trim() || undefined,
      password_hash: hash,
      provider: 'local',
    });
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'signup failed' });
  }
});

router.post('/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email and password required' });
      return;
    }
    const normalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).lean();
    if (!user || !(user as { password_hash?: string }).password_hash) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    const ok = await bcrypt.compare(password, (user as { password_hash: string }).password_hash);
    if (!ok) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: String((user as { _id: unknown })._id), email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }
  const user = await User.findById(userId)
    .select('email name created_at plan')
    .lean();
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return;
  }
  res.json(user);
});

export default router;
