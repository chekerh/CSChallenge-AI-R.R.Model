import { Response } from 'express';

export function getUserId(req: { user?: { id?: string } }, res: Response): string | null {
  const id = req.user?.id;
  if (!id) {
    res.status(401).json({ error: 'not authenticated' });
    return null;
  }
  return id;
}
