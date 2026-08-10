import './config/env';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from './models/User';
import { requireAuth } from './middleware/authMiddleware';
import { getJwtSecret, isProduction } from './config/env';
import { trackEvent } from './analytics/events';
import { sendPasswordResetEmail, sendWelcomeEmail } from './services/emailService';
import pino from 'pino';

const log = pino({ name: 'auth' });

const router = express.Router();

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 3 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez plus tard.' },
});

// Allow single-label domains (e.g. user@local) for dev/smoke; still require @ and non-empty local/domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
  if (password.length > 128) return 'Le mot de passe ne doit pas dépasser 128 caractères';
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule';
  if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule';
  if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre';
  return null;
}

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
    const pwErr = validatePassword(password);
    if (pwErr) {
      res.status(400).json({ error: pwErr });
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
    trackEvent({ userId: user._id.toString(), event: 'user.signup' });
    sendWelcomeEmail(user.email, user.name || '').catch((e) =>
      log.warn({ err: e }, 'welcome email failed')
    );
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    log.error({ err }, 'signup failed');
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
    const user = await User.findOne({ email: normalized }).select('+password_hash').lean();
    if (!user || !(user as { password_hash?: string }).password_hash) {
      trackEvent({ event: 'auth.login_failed', props: { reason: 'unknown_user', email: normalized } });
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    const ok = await bcrypt.compare(password, (user as { password_hash: string }).password_hash);
    if (!ok) {
      trackEvent({ event: 'auth.login_failed', props: { reason: 'wrong_password', email: normalized } });
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: String((user as { _id: unknown })._id), email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    trackEvent({ userId: String((user as { _id: unknown })._id), event: 'user.login' });
    res.json({ token });
  } catch (err) {
    log.error({ err }, 'login failed');
    res.status(500).json({ error: 'login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'not authenticated' });
      return;
    }
    const user = await User.findById(userId)
      .select('email name created_at plan role')
      .lean();
    if (!user) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    log.error({ err }, 'GET /me failed');
    res.status(500).json({ error: 'failed to load user' });
  }
});

// Password reset request
router.post('/forgot-password', forgotLimiter, express.json(), async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'email required' }); return; }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      // Don't reveal whether the email exists - return success anyway
      res.json({ ok: true });
      return;
    }
    const resetToken = jwt.sign({ id: user._id.toString(), purpose: 'password-reset' }, getJwtSecret(), { expiresIn: '1h' });
    user.set('reset_token', resetToken);
    user.set('reset_token_expires', new Date(Date.now() + 3600000));
    await user.save();
    trackEvent({ userId: user._id.toString(), event: 'user.password_reset_request' });
    
    // Send email instead of returning token
    await sendPasswordResetEmail(user.email, resetToken, user._id.toString());
    
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'password reset request failed');
    res.status(500).json({ error: 'password reset failed' });
  }
});

// Password reset confirmation
router.post('/reset-password', express.json(), async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) { res.status(400).json({ error: 'token and password required' }); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { res.status(400).json({ error: pwErr }); return; }
    let payload: { id: string; purpose: string };
    try { payload = jwt.verify(token, getJwtSecret()) as { id: string; purpose: string }; } catch {
      res.status(400).json({ error: 'invalid or expired token' }); return;
    }
    if (payload.purpose !== 'password-reset') { res.status(400).json({ error: 'invalid token' }); return; }
    const user = await User.findById(payload.id);
    if (!user || user.get('reset_token') !== token) { res.status(400).json({ error: 'invalid token' }); return; }
    if (user.get('reset_token_expires') && new Date(user.get('reset_token_expires') as Date) < new Date()) {
      res.status(400).json({ error: 'token expired' }); return;
    }
    user.password_hash = await bcrypt.hash(password, 10);
    user.set('reset_token', undefined);
    user.set('reset_token_expires', undefined);
    await user.save();
    trackEvent({ userId: user._id.toString(), event: 'user.password_reset' });
    res.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'password reset failed');
    res.status(500).json({ error: 'password reset failed' });
  }
});

export default router;
