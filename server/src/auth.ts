import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User';
import { requireAuth } from './middleware/authMiddleware';

const router = express.Router();

// Signup endpoint - creates a user with email + password
router.post('/signup', express.json(), async (req, res) => {
  try {
    const { email, password, name } = req.body as { email: string; password: string; name?: string };
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const hash = await bcrypt.hash(password, 10);
  const upsert = await User.findOneAndUpdate({ email }, { name: name || null, password_hash: hash, provider: 'local' }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const user = upsert;
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'signup failed' });
  }
});

// Login endpoint - email + password
router.post('/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await User.findOne({ email }).lean();
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, (user as any).password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: (user as any)._id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'login failed' });
  }
});

// Get current user's profile
router.get('/me', requireAuth, async (req, res) => {
  // @ts-ignore
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'not authenticated' });
  const user = await User.findById(userId).select('email name created_at').lean();
  res.json(user);
});

export default router;
