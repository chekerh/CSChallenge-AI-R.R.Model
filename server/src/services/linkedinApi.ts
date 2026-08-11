import jwt from 'jsonwebtoken';
import {
  getJwtSecret,
  getLinkedInClientId,
  getLinkedInClientSecret,
  getLinkedInRedirectUri,
} from '../config/env';
import { trackEvent } from '../analytics/events';

const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com';
const API_VERSION = process.env.LINKEDIN_API_VERSION || '202605';

export const LINKEDIN_SCOPES = 'openid profile email w_member_social';

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface LinkedInUserInfo {
  sub: string;
  name?: string;
  email?: string;
}

interface ApiErrorBody {
  message?: string;
  status?: number;
  serviceErrorCode?: number;
}

async function apiFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const resp = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!resp.ok && resp.status !== 201) {
    const body = (await resp.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(
      `LinkedIn API ${resp.status}: ${body?.message || body?.status || resp.statusText}`
    );
  }
  return resp;
}

export function buildLinkedInOAuthUrl(state: string, redirectUri?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getLinkedInClientId(),
    redirect_uri: redirectUri || getLinkedInRedirectUri(),
    scope: LINKEDIN_SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export function signOAuthState(userId: string): string {
  return jwt.sign({ id: userId, purpose: 'linkedin-oauth' }, getJwtSecret(), {
    expiresIn: '15m',
  });
}

export function verifyOAuthState(state: string): string {
  const payload = jwt.verify(state, getJwtSecret()) as {
    id?: string;
    purpose?: string;
  };
  if (!payload?.id || payload.purpose !== 'linkedin-oauth') {
    throw new Error('Invalid LinkedIn OAuth state');
  }
  return payload.id;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri?: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope?: string;
}> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri || getLinkedInRedirectUri(),
    client_id: getLinkedInClientId(),
    client_secret: getLinkedInClientSecret(),
  });
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await resp.json()) as TokenResponse;
  if (!resp.ok || !data.access_token) {
    throw new Error(
      `LinkedIn token exchange failed: ${data?.error_description || data?.error || resp.statusText}`
    );
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 60 * 60) * 1000),
    scope: data.scope,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getLinkedInClientId(),
    client_secret: getLinkedInClientSecret(),
  });
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await resp.json()) as TokenResponse;
  if (!resp.ok || !data.access_token) {
    throw new Error(
      `LinkedIn token refresh failed: ${data?.error_description || data?.error || resp.statusText}`
    );
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 60 * 60) * 1000),
  };
}

export async function getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const resp = await apiFetch(`${API_BASE}/v2/userinfo`, accessToken, {
    method: 'GET',
  });
  const data = (await resp.json()) as {
    sub?: string;
    name?: string;
    email?: string;
  };
  if (!data?.sub) {
    throw new Error('LinkedIn userinfo missing sub claim');
  }
  return { sub: data.sub, name: data.name, email: data.email };
}

export async function createLinkedInPost(
  accessToken: string,
  authorUrn: string,
  commentary: string
): Promise<{ postUrn: string; postUrl: string }> {
  const resp = await apiFetch(`${API_BASE}/rest/posts`, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      visibility: 'PUBLIC',
      commentary,
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
    }),
  });
  const postUrn = resp.headers.get('x-restli-id');
  if (!postUrn) {
    const body = (await resp.json().catch(() => ({}))) as { id?: string };
    if (!body?.id) throw new Error('LinkedIn post created but URN was not returned');
    return { postUrn: body.id, postUrl: buildPostUrl(body.id) };
  }
  trackEvent({ event: 'linkedin.post_api_created', props: { urn: postUrn } });
  return { postUrn, postUrl: buildPostUrl(postUrn) };
}

export interface LinkedComment {
  comment_urn: string;
  author_name?: string;
  text: string;
  created_at?: Date;
}

export async function getPostComments(
  accessToken: string,
  postUrn: string
): Promise<LinkedComment[]> {
  const encoded = encodeURIComponent(postUrn);
  const resp = await apiFetch(
    `${API_BASE}/rest/socialActions/${encoded}/comments?count=50`,
    accessToken,
    { method: 'GET' }
  );
  const data = (await resp.json()) as {
    elements?: Array<{
      id?: string;
      actor?: string;
      message?: { text?: string };
      created?: { time?: number };
    }>;
  };
  const elements = data?.elements || [];
  return elements.map((el) => ({
    comment_urn: el.id || '',
    author_name: el.actor ? urnSuffix(el.actor) : undefined,
    text: el.message?.text || '',
    created_at: el.created?.time ? new Date(el.created.time) : undefined,
  }));
}

export async function createComment(
  accessToken: string,
  postUrn: string,
  text: string,
  parentCommentUrn?: string
): Promise<string> {
  const encoded = encodeURIComponent(postUrn);
  const resp = await apiFetch(
    `${API_BASE}/rest/socialActions/${encoded}/comments`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        object: postUrn,
        message: { text },
        ...(parentCommentUrn ? { parentComment: parentCommentUrn } : {}),
      }),
    }
  );
  const commentUrn = resp.headers.get('x-restli-id');
  if (!commentUrn) {
    const body = (await resp.json().catch(() => ({}))) as { id?: string };
    if (!body?.id) throw new Error('LinkedIn comment created but URN was not returned');
    return body.id;
  }
  return commentUrn;
}

export function buildPersonUrn(linkedinUserId: string): string {
  return `urn:li:person:${linkedinUserId}`;
}

function buildPostUrl(postUrn: string): string {
  const id = urnSuffix(postUrn) || postUrn;
  return `https://www.linkedin.com/feed/update/${postUrn.includes('activity') ? `urn:li:activity:${id}` : postUrn}`;
}

export function urnSuffix(urn: string): string {
  const parts = urn.split(':');
  return parts[parts.length - 1] || urn;
}
