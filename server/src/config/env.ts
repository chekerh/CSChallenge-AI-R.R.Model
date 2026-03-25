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
    if (isProduction()) {
      throw new Error('JWT_SECRET must be set to a strong value (min 16 chars) in production');
    }
    return 'dev-only-change-me';
  }
  return secret;
}

export function getCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || raw === '*') {
    if (isProduction()) {
      console.warn('CORS_ORIGIN not set; defaulting to no cross-origin in production is recommended — set CORS_ORIGIN explicitly');
    }
    return true;
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
