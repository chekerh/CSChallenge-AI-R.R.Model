import { API_BASE } from '../api';

type ApiResult<T> = { data: T; error?: undefined } | { error: string; data?: undefined };

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

export interface JobAgentDto {
  _id: string; name: string; enabled: boolean; schedule: string;
  keywords: string[]; location: string; status: string;
  last_run: string | null; last_error: string | null;
  created_at: string;
}

export interface JobApplicationDto {
  _id: string; company: string; position: string; url?: string;
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'accepted';
  match_score?: number; notes?: string; applied_date?: string | null;
  created_at: string;
}

export interface JobStatsDto {
  total_agents: number; active_agents: number;
  total_applications: number; by_status: Record<string, number>;
  average_score: number;
}

export function fetchAgents(token: string) {
  return api<JobAgentDto[]>('/jobs/agents', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
}

export function createAgent(token: string, data: { name: string; keywords: string[]; location: string; schedule: string }) {
  return api<JobAgentDto>('/jobs/agents', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export function updateAgent(token: string, id: string, data: Partial<JobAgentDto>) {
  return api<JobAgentDto>(`/jobs/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export function deleteAgent(token: string, id: string) {
  return api<{ ok: boolean }>(`/jobs/agents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

export function runAgent(token: string, id: string) {
  return api<{ ok: boolean }>(`/jobs/agents/${id}/run`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export function fetchApplications(token: string) {
  return api<JobApplicationDto[]>('/jobs/applications', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
}

export function createApplication(token: string, data: { company: string; position: string; url?: string; status?: string; match_score?: number; notes?: string }) {
  return api<JobApplicationDto>('/jobs/applications', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export function updateApplication(token: string, id: string, data: Partial<JobApplicationDto>) {
  return api<JobApplicationDto>(`/jobs/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export function deleteApplication(token: string, id: string) {
  return api<{ ok: boolean }>(`/jobs/applications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

export function fetchJobStats(token: string) {
  return api<JobStatsDto>('/jobs/stats', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
}
