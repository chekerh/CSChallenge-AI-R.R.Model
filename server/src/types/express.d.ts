import type { AppRole } from '../middleware/requireRole';

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      role?: AppRole;
    }

    interface Request {
      id?: string;
      user?: User;
    }
  }
}

export {};
