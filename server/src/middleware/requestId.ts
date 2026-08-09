import { randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Assign a unique request ID to every incoming request.
 * The ID is returned in the `X-Request-Id` response header
 * and attached to `req` for downstream logging.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || randomBytes(16).toString('hex');
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
