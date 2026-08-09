import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino({ name: 'error-handler' });

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id || 'unknown';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      requestId,
    });
    return;
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    res.status(409).json({
      error: 'Resource already exists',
      requestId,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Invalid or expired token',
      requestId,
    });
    return;
  }

  // Log unexpected errors
  logger.error({ err, requestId, path: req.path, method: req.method }, 'Unhandled error');

  res.status(500).json({
    error: 'Internal server error',
    requestId,
  });
}
