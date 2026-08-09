import path from 'path';
import dotenv from 'dotenv';

// Load server/.env relative to compiled output (dist/) or source (src/)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
// Fallback: cwd when running via ts-node from server/
dotenv.config();

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set to a strong value (min 16 chars)');
  }
  return secret;
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (isProduction()) {
    if (!raw) {
      throw new Error('CORS_ORIGIN must be set in production');
    }
  }
  if (!raw || raw === '*') {
    return ['http://localhost:5173'];
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

const requiredCorsOrigin = process.env.REQUIRED_CORS_ORIGIN;
if (requiredCorsOrigin && !process.env.CORS_ORIGIN?.includes(requiredCorsOrigin)) {
  throw new Error(`REQUIRED_CORS_ORIGIN "${requiredCorsOrigin}" is not present in CORS_ORIGIN`);
}

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (isProduction()) {
      throw new Error('STRIPE_SECRET_KEY must be set in production');
    }
    return 'sk_test_placeholder';
  }
  return key;
}

export function getResendApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (isProduction()) {
      throw new Error('RESEND_API_KEY must be set in production');
    }
    return 're_placeholder';
  }
  return key;
}

export function hasLinkedInConfig(): boolean {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export function getLinkedInClientId(): string {
  const v = process.env.LINKEDIN_CLIENT_ID;
  if (!v) {
    if (isProduction()) throw new Error('LINKEDIN_CLIENT_ID must be set in production');
    return 'dev_linkedin_client_id';
  }
  return v;
}

export function getLinkedInClientSecret(): string {
  const v = process.env.LINKEDIN_CLIENT_SECRET;
  if (!v) {
    if (isProduction()) throw new Error('LINKEDIN_CLIENT_SECRET must be set in production');
    return 'dev_linkedin_client_secret';
  }
  return v;
}

export function getLinkedInRedirectUri(): string {
  return process.env.LINKEDIN_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/linkedin/oauth/callback`;
}

export function getLinkedInPostTime(): string {
  // Cron format for the daily auto-post. Default 09:00.
  return process.env.LINKEDIN_POST_TIME || '0 9 * * *';
}

export function getLinkedInCommentSweepMinutes(): number {
  const v = parseInt(process.env.LINKEDIN_COMMENT_SWEEP_MINUTES || '30', 10);
  return Number.isFinite(v) && v > 0 ? v : 30;
}
