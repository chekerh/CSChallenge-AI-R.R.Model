import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { getJwtSecret } from '../config/env';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }
  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret) as { id?: string; email?: string };
    if (!payload?.id) {
      res.status(401).json({ error: 'invalid token' });
      return;
    }
    req.user = { id: String(payload.id), email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}
