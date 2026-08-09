import { API_BASE } from '../api';

type ApiResult<T> = { data: T } | { error: string };

async function api<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, init);
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: data?.error || `Request failed (${res.status})` };
    return { data: data as T };
  } catch {
    return { error: 'Network error' };
  }
}

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export type LinkedInTone = 'balanced' | 'diagnostic' | 'story' | 'anti-hype';
export type LinkedInPostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'canceled';
export type LinkedInReplyStatus = 'pending' | 'approved' | 'sent' | 'dismissed';

export interface LinkedInStatsDto {
  total_posts: number;
  published: number;
  pending_comments: number;
}

export interface LinkedInStatusDto {
  configured: boolean;
  redirect_uri: string;
  connected: boolean;
  name: string | null;
  expires_at: string | null;
  auto_post: boolean;
  auto_reply: boolean;
  post_time: string;
  tone: LinkedInTone;
  last_publish_at: string | null;
  last_error: string | null;
  stats: LinkedInStatsDto;
}

export interface LinkedInAccountDto {
  _id: string;
  user_id: string;
  linkedin_user_id: string;
  linkedin_user_name: string | null;
  expires_at: string | null;
  scope: string | null;
  auto_post: boolean;
  auto_reply: boolean;
  post_time: string;
  tone: LinkedInTone;
  connected_at: string;
  last_publish_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInPostDto {
  _id: string;
  text: string;
  source: 'manual' | 'ai';
  status: LinkedInPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  post_url: string | null;
  community: string | null;
  concepts: string[];
  likes: number;
  comments_count: number;
  shares: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInDraftDto {
  text: string;
  community: string;
  concepts: string[];
}

export interface LinkedInCommentDto {
  _id: string;
  post_id: string | null;
  post_urn: string | null;
  comment_urn: string;
  author_name: string | null;
  text: string;
  received_at: string;
  reply_text: string | null;
  reply_status: LinkedInReplyStatus;
  replied_at: string | null;
  reply_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInPillarDto {
  id: number;
  label: string;
  nodes: number;
}

export function fetchLinkedInStatus(token: string) {
  return api<LinkedInStatusDto>('/linkedin/status', { method: 'GET', headers: auth(token) });
}

export function getLinkedInAuthUrl(token: string) {
  return api<{ url: string }>('/linkedin/auth-url', { method: 'GET', headers: auth(token) });
}

export function updateLinkedInSettings(
  token: string,
  data: Partial<{ auto_post: boolean; auto_reply: boolean; post_time: string; tone: LinkedInTone }>
) {
  return api<LinkedInAccountDto>('/linkedin/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { ...auth(token), 'Content-Type': 'application/json' },
  });
}

export function disconnectLinkedIn(token: string) {
  return api<{ ok: boolean }>('/linkedin/disconnect', { method: 'POST', headers: auth(token) });
}

export function fetchLinkedInPosts(token: string) {
  return api<LinkedInPostDto[]>('/linkedin/posts', { method: 'GET', headers: auth(token) });
}

export function createLinkedInPost(token: string, data: { text?: string }) {
  return api<LinkedInPostDto>('/linkedin/posts', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { ...auth(token), 'Content-Type': 'application/json' },
  });
}

export function generateLinkedInDrafts(token: string, count: number) {
  return api<{ drafts: LinkedInDraftDto[] }>('/linkedin/posts', {
    method: 'POST',
    body: JSON.stringify({ generate: true, count }),
    headers: { ...auth(token), 'Content-Type': 'application/json' },
  });
}

export function updateLinkedInPost(
  token: string,
  id: string,
  data: Partial<{ text: string; scheduled_at: string; status: LinkedInPostStatus }>
) {
  return api<LinkedInPostDto>(`/linkedin/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { ...auth(token), 'Content-Type': 'application/json' },
  });
}

export function deleteLinkedInPost(token: string, id: string) {
  return api<{ ok: boolean }>(`/linkedin/posts/${id}`, { method: 'DELETE', headers: auth(token) });
}

export function publishLinkedInPost(token: string, id: string) {
  return api<LinkedInPostDto>(`/linkedin/posts/${id}/publish`, { method: 'POST', headers: auth(token) });
}

export function fetchLinkedInComments(token: string) {
  return api<LinkedInCommentDto[]>('/linkedin/comments', { method: 'GET', headers: auth(token) });
}

export function generateCommentReply(token: string, id: string) {
  return api<LinkedInCommentDto>(`/linkedin/comments/${id}/generate-reply`, { method: 'POST', headers: auth(token) });
}

export function sendCommentReply(token: string, id: string, text?: string) {
  return api<LinkedInCommentDto>(`/linkedin/comments/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: { ...auth(token), 'Content-Type': 'application/json' },
  });
}

export function dismissComment(token: string, id: string) {
  return api<LinkedInCommentDto>(`/linkedin/comments/${id}/dismiss`, { method: 'POST', headers: auth(token) });
}

export function fetchLinkedInPillars(token: string) {
  return api<{ pillars: LinkedInPillarDto[] }>('/linkedin/pillars', { method: 'GET', headers: auth(token) });
}
