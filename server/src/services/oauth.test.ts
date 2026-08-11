import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isOAuthProvider,
  signOAuthState,
  verifyOAuthState,
  oauthFallbackEmail,
  buildOAuthAuthUrl,
  oauthRedirectUri,
} from './oauth';

const ORIGINAL_JWT = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = 'a'.repeat(32);
});

afterEach(() => {
  if (ORIGINAL_JWT) process.env.JWT_SECRET = ORIGINAL_JWT;
  else delete process.env.JWT_SECRET;
});

describe('isOAuthProvider', () => {
  it('accepts google and linkedin', () => {
    expect(isOAuthProvider('google')).toBe(true);
    expect(isOAuthProvider('linkedin')).toBe(true);
  });

  it('rejects unknown providers', () => {
    expect(isOAuthProvider('facebook')).toBe(false);
    expect(isOAuthProvider('')).toBe(false);
  });
});

describe('OAuth state', () => {
  it('verifies a freshly signed state for the matching provider', () => {
    const state = signOAuthState('google');
    expect(verifyOAuthState(state, 'google')).toBe(true);
  });

  it('rejects a state signed for another provider', () => {
    const state = signOAuthState('google');
    expect(verifyOAuthState(state, 'linkedin')).toBe(false);
  });

  it('rejects a tampered state', () => {
    const state = signOAuthState('google');
    expect(verifyOAuthState(`${state}tampered`, 'google')).toBe(false);
  });

  it('rejects an empty state', () => {
    expect(verifyOAuthState('', 'google')).toBe(false);
  });
});

describe('oauthFallbackEmail', () => {
  it('builds a stable provider-scoped email', () => {
    expect(oauthFallbackEmail('google', '1234567890')).toBe(
      'google_1234567890@oauth.local'
    );
  });

  it('sanitizes unsafe characters from the provider id', () => {
    expect(oauthFallbackEmail('linkedin', 'ab-cd!@#$%^&*()_123')).toBe(
      'linkedin_ab-cd_123@oauth.local'
    );
  });

  it('falls back to unknown when provider id is empty', () => {
    expect(oauthFallbackEmail('google', '')).toBe('google_unknown@oauth.local');
  });
});

describe('buildOAuthAuthUrl', () => {
  it('builds a Google authorization URL with required params', () => {
    const url = buildOAuthAuthUrl('google', 'state123');
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://accounts.google.com');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('client_id')).toBe('dev_google_client_id');
    expect(parsed.searchParams.get('state')).toBe('state123');
    expect(parsed.searchParams.get('scope')).toContain('openid');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      oauthRedirectUri('google')
    );
  });

  it('builds a LinkedIn authorization URL pointing at the sign-in callback', () => {
    const url = buildOAuthAuthUrl('linkedin', 'state123');
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://www.linkedin.com');
    expect(parsed.searchParams.get('state')).toBe('state123');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      oauthRedirectUri('linkedin')
    );
  });
});
