import jwt from 'jsonwebtoken';
import {
  getJwtSecret,
  hasGoogleConfig,
  getGoogleClientId,
  getGoogleClientSecret,
  getOAuthCallbackBase,
  hasLinkedInConfig,
} from '../config/env';
import User from '../models/User';
import { buildLinkedInOAuthUrl, exchangeCodeForToken, getUserInfo as getLinkedInUserInfo } from './linkedinApi';import { trackEvent } from '../analytics/events';

export type OAuthProvider = 'google' | 'linkedin';

export interface OAuthIdentity {
  provider_id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'linkedin'];

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_SCOPES = 'openid email profile';

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as string[]).includes(value);
}

export function hasOAuthConfig(provider: OAuthProvider): boolean {
  return provider === 'google' ? hasGoogleConfig() : hasLinkedInConfig();
}

export function oauthRedirectUri(provider: OAuthProvider): string {
  return `${getOAuthCallbackBase()}/auth/oauth/${provider}/callback`;
}

export function buildOAuthAuthUrl(provider: OAuthProvider, state: string): string {
  if (provider === 'linkedin') {
    return buildLinkedInOAuthUrl(state, oauthRedirectUri('linkedin'));
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getGoogleClientId(),
    redirect_uri: oauthRedirectUri('google'),
    scope: GOOGLE_SCOPES,
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function signOAuthState(provider: OAuthProvider): string {
  return jwt.sign({ purpose: 'oauth-login', provider }, getJwtSecret(), {
    expiresIn: '15m',
  });
}

export function verifyOAuthState(state: string, provider: OAuthProvider): boolean {
  try {
    const payload = jwt.verify(state, getJwtSecret()) as {
      purpose?: string;
      provider?: string;
    };
    return payload?.purpose === 'oauth-login' && payload?.provider === provider;
  } catch {
    return false;
  }
}

async function exchangeGoogleCode(code: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: oauthRedirectUri('google'),
  });
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await resp.json()) as TokenResponse;
  if (!resp.ok || !data.access_token) {
    throw new Error(
      `Google token exchange failed: ${data?.error_description || data?.error || resp.statusText}`
    );
  }
  return data.access_token;
}

async function fetchGoogleUser(accessToken: string): Promise<OAuthIdentity> {
  const resp = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await resp.json()) as GoogleUserInfo;
  if (!resp.ok || !data.id) {
    throw new Error('Google userinfo request failed');
  }
  return {
    provider_id: data.id,
    email: data.email,
    name: data.name,
    avatar: data.picture,
  };
}

export async function getOAuthIdentity(
  provider: OAuthProvider,
  code: string
): Promise<OAuthIdentity> {
  if (provider === 'linkedin') {
    const tokens = await exchangeCodeForToken(code, oauthRedirectUri('linkedin'));
    const info = await getLinkedInUserInfo(tokens.accessToken);
    return { provider_id: info.sub, email: info.email, name: info.name };
  }
  const accessToken = await exchangeGoogleCode(code);
  return fetchGoogleUser(accessToken);
}

export function oauthFallbackEmail(provider: OAuthProvider, providerId: string): string {
  const safe = providerId.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40) || 'unknown';
  return `${provider}_${safe}@oauth.local`;
}

export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  identity: OAuthIdentity
): Promise<{ user: InstanceType<typeof User>; created: boolean; linked: boolean }> {
  let user = await User.findOne({ provider, provider_id: identity.provider_id });
  if (user) return { user, created: false, linked: false };

  const email = identity.email?.trim().toLowerCase();
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user.set('provider', provider);
      user.set('provider_id', identity.provider_id);
      if (identity.name) user.set('name', identity.name);
      if (identity.avatar) user.set('avatar', identity.avatar);
      await user.save();
      return { user, created: false, linked: true };
    }
  }

  user = await User.create({
    email: email || oauthFallbackEmail(provider, identity.provider_id),
    name: identity.name,
    provider,
    provider_id: identity.provider_id,
    avatar: identity.avatar,
  });
  trackEvent({ userId: user._id.toString(), event: `user.oauth_signup.${provider}` });
  return { user, created: true, linked: false };
}
