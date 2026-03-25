import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import passport from 'passport';
import authRouter from './auth';
import resumeRouter from './routes/resume';
import kaggleRouter from './routes/kaggle';
import cvPremiumRouter from './routes/cvPremium';
import { connect } from './db';
import { getCorsOrigins, isProduction } from './config/env';

const app = express();
if (isProduction()) {
  app.set('trust proxy', 1);
}

const corsOrigins = getCorsOrigins();
app.use(
  cors({
    origin: corsOrigins === true ? true : corsOrigins,
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '2mb' }));
app.use(passport.initialize());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction() ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use((req, res, next) => {
  const ts = new Date().toISOString();
  if (isProduction()) {
    console.log(`${ts} ${req.method} ${req.path}`);
  } else {
    console.log(`${ts} ${req.method} ${req.path} from ${req.ip}`);
  }
  next();
});

app.use('/auth', authLimiter, authRouter);
app.use('/resumes', apiLimiter, resumeRouter);
app.use('/kaggle', apiLimiter, kaggleRouter);
app.use('/cv', apiLimiter, cvPremiumRouter);

app.get('/health', async (_req, res) => {
  try {
    const dbOk = mongoose.connection.readyState === 1;
    const body = { ok: dbOk, db: dbOk ? 'up' : 'down' };
    res.status(dbOk ? 200 : 503).json(body);
  } catch (err) {
    console.error('health error', err);
    res.status(503).json({ ok: false, db: 'error' });
  }
});

const port = parseInt(process.env.PORT || '4000', 10);
const host = process.env.HOST || '0.0.0.0';

async function startServer(): Promise<void> {
  await connect();
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log(`Health: http://localhost:${port}/health`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
