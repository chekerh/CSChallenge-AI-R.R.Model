import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { recordError } from '../services/monitoring';

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

/**
 * Records any response that ends with a 5xx or 429 status, even when the
 * error was handled inside a route's own try/catch and never reached the
 * centralized error handler. Mounted early so `res.on('finish')` wraps every
 * request. Errors already recorded by `errorHandler` are skipped via a flag.
 */
export function responseMonitor(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const code = res.statusCode;
    if ((code >= 500 || code === 429) && !(res as { __errorRecorded?: boolean }).__errorRecorded) {
      recordError({
        requestId: req.id === undefined ? 'unknown' : String(req.id),
        path: req.path,
        method: req.method,
        statusCode: code,
        name: code === 429 ? 'RateLimitError' : 'HttpServerError',
        message: `${req.method} ${req.originalUrl || req.path} → ${code}`,
        userId: (req.user as { id?: string } | undefined)?.id ?? null,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        handled: true,
      });
    }
  });
  next();
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id === undefined ? 'unknown' : String(req.id);
  const userId = (req.user as { id?: string } | undefined)?.id ?? null;

  recordError({
    requestId,
    path: req.path,
    method: req.method,
    statusCode:
      err instanceof AppError
        ? err.statusCode
        : err.name === 'ValidationError'
          ? 400
          : (err as { code?: unknown }).code === 11000
            ? 409
            : err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'
              ? 401
              : err.name === 'ServiceUnavailableError'
                ? 503
                : err.name === 'BudgetExceededError'
                  ? 429
                  : 500,
    name: err.name,
    message: err.message,
    code: (err as AppError).code,
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    stack: err.stack,
    handled: true,
  });
  (res as { __errorRecorded?: boolean }).__errorRecorded = true;

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
