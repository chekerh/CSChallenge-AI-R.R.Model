import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
});

describe('getJwtSecret', () => {
  it('throws when secret missing or too short', async () => {
    process.env.JWT_SECRET = 'short';
    const { getJwtSecret } = await import('./env');
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('returns configured secret when long enough', async () => {
    process.env.JWT_SECRET = 'a'.repeat(16);
    const { getJwtSecret } = await import('./env');
    expect(getJwtSecret()).toBe('a'.repeat(16));
  });
});
