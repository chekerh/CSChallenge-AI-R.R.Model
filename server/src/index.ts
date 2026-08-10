import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRouter from './auth';
import resumeRouter from './routes/resume';
import kaggleRouter from './routes/kaggle';
import cvPremiumRouter from './routes/cvPremium';
import adminRouter from './routes/admin';
import publicRouter from './routes/public';
import jobsRouter from './routes/jobs';
import billingRouter from './routes/billing';
import linkedinRouter from './routes/linkedin';
import notificationsRouter from './routes/notifications';
import { startLinkedInScheduler } from './services/linkedinScheduler';
import { startMonitoringWorker } from './services/monitoring';
import { connect } from './db';
import { getCorsOrigins, isProduction } from './config/env';
import { bootstrapSuperAdmin } from './config/bootstrapAdmin';
import { bootstrapDefaultPlans } from './config/bootstrapPlans';
import { requestId } from './middleware/requestId';
import { notFoundHandler, errorHandler, responseMonitor } from './middleware/errorHandler';
import pino from 'pino';
import pinoHttp from 'pino-http';

const app = express();
const logger = pino({
  level: isProduction() ? 'info' : 'debug',
  ...(isProduction() && {
    formatters: {
      level: (label) => ({ level: label }),
    },
  }),
});

if (isProduction()) {
  app.set('trust proxy', 1);
}

// Add request ID to every request
app.use(requestId);

// Add structured logging
app.use(pinoHttp(logger));

// Record 5xx/429 responses (route-level catches that never reach errorHandler)
app.use(responseMonitor);

const corsOrigins = getCorsOrigins();
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction() ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  } : false,
}));

// Conditional body parsing: skip express.json() for Stripe webhook raw body verification
app.use((req, res, next) => {
  if (req.originalUrl === '/billing/webhook') {
    next();
  } else {
    express.json({ limit: '2mb' })(req, res, next);
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook requests, please try again later' },
});

app.use('/billing/webhook', webhookLimiter);
app.use('/auth', authLimiter, authRouter);
app.use('/resumes', apiLimiter, resumeRouter);
app.use('/kaggle', apiLimiter, kaggleRouter);
app.use('/cv', apiLimiter, cvPremiumRouter);
app.use('/admin', apiLimiter, adminRouter);
app.use('/public', apiLimiter, publicRouter);
app.use('/jobs', apiLimiter, jobsRouter);
app.use('/billing', apiLimiter, billingRouter);
app.use('/linkedin', apiLimiter, linkedinRouter);
app.use('/notifications', apiLimiter, notificationsRouter);

const startedAt = new Date();

app.get('/health', async (_req, res) => {
  try {
    const dbOk = mongoose.connection.readyState === 1;
    const uptime = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const body = {
      ok: dbOk,
      db: dbOk ? 'up' : 'down',
      uptime,
      version: process.env.npm_package_version || '0.1.0',
      startedAt: startedAt.toISOString(),
    };
    res.status(dbOk ? 200 : 503).json(body);
  } catch (err) {
    logger.error({ err }, 'health check error');
    res.status(503).json({ ok: false, db: 'error' });
  }
});

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '0.0.0.0';

let server: ReturnType<typeof app.listen>;

async function startServer(): Promise<void> {
  await connect();
  await bootstrapDefaultPlans();
  await bootstrapSuperAdmin();
  server = app.listen(port, host, () => {
    logger.info({ port, host }, 'Server running');
    logger.info(`Health: http://localhost:${port}/health`);
  });
  if (process.env.NODE_ENV === 'test') return;
  startLinkedInScheduler();
  startMonitoringWorker();
}

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info({ signal }, 'Received signal, shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      mongoose.connection.close(false).then(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }

  // Force exit after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
});

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
