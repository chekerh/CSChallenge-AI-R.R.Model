import { API_BASE } from '../api';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export async function api<T = unknown>(
  path: string,
  options?: RequestInit & { params?: Record<string, string | undefined> },
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options?.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  if (options?.headers) Object.assign(headers, options.headers);

  let url = `${API_BASE}${path}`;
  if (options?.params) {
    const qs = Object.entries(options.params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Erreur ${res.status}`,
      res.status,
      data?.code,
    );
  }

  return data as T;
}
