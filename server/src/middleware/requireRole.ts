import type { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export type AppRole = 'user' | 'support' | 'admin' | 'super_admin';

const ROLE_ORDER: Record<AppRole, number> = {
  user: 0,
  support: 1,
  admin: 2,
  super_admin: 3,
};

export function requireRole(minRole: AppRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'not authenticated' });
      return;
    }
    const baseUser = req.user!;
    const u = await User.findById(userId).select('role email').lean();
    const role = (u as { role?: AppRole } | null)?.role ?? 'user';
    req.user = {
      id: baseUser.id,
      email: baseUser.email ?? (u as { email?: string } | null)?.email,
      role,
    };
    if (ROLE_ORDER[role] < ROLE_ORDER[minRole]) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
}

