import { API_BASE } from '../api';

export interface ApiError {
  error: string;
  status?: number;
}

export interface ResumeVersionDto {
  _id: string;
  resume_id: string;
  version_label: string;
  content_text: string;
  created_at?: string;
}

export interface FeedbackDto {
  _id: string;
  resume_version_id: string;
  author?: string;
  suggestions?: unknown;
  created_at?: string;
}

export interface ResumeSummaryDto {
  _id: string;
  title?: string;
  created_at?: string;
  /** Number of stored versions (from API); 0 = orphan / failed import. */
  version_count?: number;
}

export interface MeDto {
  email?: string;
  name?: string;
  plan?: string;
  created_at?: string;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: 'Invalid JSON response' };
  }
}

export async function uploadResume(
  token: string,
  file: File,
  title?: string
): Promise<{ resumeId: string; versionId: string } | ApiError> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (!res.ok) {
      return { error: String(data.error || 'Upload failed'), status: res.status };
    }
    const resumeId = data.resumeId as string | undefined;
    const versionId = data.versionId as string | undefined;
    if (!resumeId || !versionId) {
      return { error: 'Invalid server response' };
    }
    return { resumeId, versionId };
  } catch {
    return { error: 'Upload failed' };
  }
}

export async function listResumes(
  token: string
): Promise<ResumeSummaryDto[] | ApiError> {
  try {
    const res = await fetch(`${API_BASE}/resumes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseJson(res);
    if (!res.ok) {
      const o = data as Record<string, unknown>;
      return { error: String(o.error || 'Failed to load resumes'), status: res.status };
    }
    if (!Array.isArray(data)) {
      return { error: 'Invalid server response' };
    }
    return data as ResumeSummaryDto[];
  } catch {
    return { error: 'Failed to load resumes' };
  }
}

export async function fetchMe(token: string): Promise<MeDto | ApiError> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseJson(res);
    if (!res.ok) {
      const o = data as Record<string, unknown>;
      return { error: String(o.error || 'Failed to load profile'), status: res.status };
    }
    const o = data as Record<string, unknown>;
    return {
      email: typeof o.email === 'string' ? o.email : undefined,
      name: typeof o.name === 'string' ? o.name : undefined,
      plan: typeof o.plan === 'string' ? o.plan : undefined,
      created_at:
        o.created_at != null ? String(o.created_at) : undefined,
    };
  } catch {
    return { error: 'Network error' };
  }
}

export async function downloadVersionText(
  token: string,
  versionId: string
): Promise<{ text: string } | ApiError> {
  try {
    const res = await fetch(
      `${API_BASE}/resumes/versions/${versionId}/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const data = (await parseJson(res)) as Record<string, unknown>;
      return {
        error: String(data.error || 'Download failed'),
        status: res.status,
      };
    }
    const text = await res.text();
    return { text };
  } catch {
    return { error: 'Download failed' };
  }
}

export async function deleteResume(
  token: string,
  resumeId: string
): Promise<{ ok?: boolean } | ApiError> {
  try {
    const res = await fetch(`${API_BASE}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (!res.ok) {
      return {
        error: String(data.error || 'Delete failed'),
        status: res.status,
      };
    }
    return data as { ok?: boolean };
  } catch {
    return { error: 'Delete failed' };
  }
}

export async function listResumeVersions(
  token: string,
  resumeId: string
): Promise<ResumeVersionDto[] | ApiError> {
  try {
    const res = await fetch(`${API_BASE}/resumes/${resumeId}/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseJson(res);
    if (!res.ok) {
      const o = data as Record<string, unknown>;
      return { error: String(o.error || 'Failed to load versions'), status: res.status };
    }
    return data as ResumeVersionDto[];
  } catch {
    return { error: 'Failed to load versions' };
  }
}

export async function listFeedbacksForVersion(
  token: string,
  versionId: string
): Promise<FeedbackDto[] | ApiError> {
  try {
    const res = await fetch(
      `${API_BASE}/resumes/versions/${versionId}/feedbacks`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await parseJson(res);
    if (!res.ok) {
      const o = data as Record<string, unknown>;
      return { error: String(o.error || 'Failed to load feedback'), status: res.status };
    }
    return data as FeedbackDto[];
  } catch {
    return { error: 'Failed to load feedback' };
  }
}

/** Runs AI processing on a specific resume version (not the resume id). */
export async function processResumeVersion(
  token: string,
  versionId: string
): Promise<
  | {
      ok?: boolean;
      newVersionId?: string;
      analysis?: unknown;
    }
  | ApiError
> {
  try {
    const res = await fetch(
      `${API_BASE}/resumes/versions/${versionId}/process`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }
    );
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (!res.ok) {
      return {
        error: String(data.error || 'Processing failed'),
        status: res.status,
      };
    }
    return data as { ok?: boolean; newVersionId?: string; analysis?: unknown };
  } catch {
    return { error: 'Network error during processing' };
  }
}

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<{ token: string } | ApiError> {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (!res.ok) {
      return { error: String(data.error || 'Signup failed'), status: res.status };
    }
    const token = data.token as string | undefined;
    if (!token) return { error: 'Invalid server response' };
    return { token };
  } catch {
    return { error: 'Network error' };
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string } | ApiError> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (!res.ok) {
      return { error: String(data.error || 'Login failed'), status: res.status };
    }
    const token = data.token as string | undefined;
    if (!token) return { error: 'Invalid server response' };
    return { token };
  } catch {
    return { error: 'Network error' };
  }
}
