import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import authRouter from './auth';
import resumeRouter from './routes/resume';
import kaggleRouter from './routes/kaggle';
import { connect } from './db';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

let isConnected = false;

// simple request logger for debugging connectivity
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} from ${req.ip}`);
  next();
});

app.use('/auth', authRouter);
app.use('/resumes', resumeRouter);
app.use('/kaggle', kaggleRouter);

app.get('/health', async (req, res) => {
  try {
    console.log('health check from', req.ip, 'headers:', {
      host: req.headers.host,
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent'],
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('health error', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const port = parseInt(process.env.PORT || '4000', 10);
const host = '0.0.0.0'; // Listen on all network interfaces

// Start server after connecting to MongoDB
async function startServer() {
  try {
    if (!isConnected) {
      console.log('Connecting to MongoDB...');
      await connect();
      isConnected = true;
      console.log('MongoDB connected');
    }

    app.listen(port, host, () => {
      console.log(`Server running on http://${host}:${port}`);
      console.log(`Health check endpoint: http://localhost:${port}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// better process-level handlers to capture why the process might exit
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer();

console.log('Connecting to MongoDB...');
connect().then(() => {
  const host = process.env.HOST || '127.0.0.1';
  const portNum = Number(port);
  app.listen(portNum, host, () => console.log(`Server running on http://${host}:${portNum}`));
}).catch(err => {
  console.error('Failed to connect to DB', err);
  process.exit(1);
});
