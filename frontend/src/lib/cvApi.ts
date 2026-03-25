import { API_BASE } from '../api';
import type {
  CvBuilderProfile,
  CvDiagnosisApiResponse,
  CvJobMatchResult,
  CvOutputLanguage,
  CvRewriteSectionResult,
  CvTargetRole,
} from '@utopiahire/shared';

async function cvFetch<T>(
  token: string,
  path: string,
  init: { method?: 'GET' | 'POST'; json?: object } = {}
): Promise<{ data?: T; error?: string; status?: number; code?: string }> {
  const method = init.method ?? 'POST';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const reqInit: RequestInit = { method, headers };
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    reqInit.body = JSON.stringify(init.json ?? {});
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, reqInit);
    const data = (await res.json()) as {
      error?: string;
      code?: string;
    } & Partial<T>;
    if (!res.ok) {
      return {
        error: data.error || res.statusText,
        status: res.status,
        code: data.code,
      };
    }
    return { data: data as T };
  } catch {
    return { error: 'Network error' };
  }
}

export function postCvDiagnosis(
  token: string,
  text: string,
  outputLanguage: CvOutputLanguage,
  targetRole: CvTargetRole
) {
  return cvFetch<CvDiagnosisApiResponse>(token, '/cv/diagnosis', {
    json: { text, outputLanguage, targetRole },
  });
}

export function postCvRewriteSection(
  token: string,
  input: {
    sectionType: string;
    sectionText: string;
    outputLanguage: CvOutputLanguage;
    targetRole: CvTargetRole;
  }
) {
  return cvFetch<CvRewriteSectionResult>(token, '/cv/rewrite-section', {
    json: input,
  });
}

export function postCvJobMatch(
  token: string,
  text: string,
  jobDescription: string,
  outputLanguage: CvOutputLanguage,
  targetRole: CvTargetRole
) {
  return cvFetch<CvJobMatchResult>(token, '/cv/job-match', {
    json: { text, jobDescription, outputLanguage, targetRole },
  });
}

export type CvBuilderDraftApi = {
  title?: string;
  profile: CvBuilderProfile;
  compiled_text?: string;
  updated_at?: string;
};

export function getCvBuilderDraft(token: string) {
  return cvFetch<{ draft: CvBuilderDraftApi | null }>(token, '/cv/builder/draft', {
    method: 'GET',
  });
}

export function saveCvBuilderDraft(
  token: string,
  input: { title?: string; profile: CvBuilderProfile }
) {
  return cvFetch<{ ok: boolean; compiled_text: string }>(token, '/cv/builder/draft', {
    json: input,
  });
}

export function publishCvBuilder(
  token: string,
  input: { title?: string; profile: CvBuilderProfile }
) {
  return cvFetch<{ ok: boolean; resumeId: string; versionId: string }>(
    token,
    '/cv/builder/publish',
    { json: input }
  );
}

export async function getAuthPlan(
  token: string
): Promise<'free' | 'pro' | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { plan?: string };
    if (!res.ok) return null;
    return data.plan === 'pro' ? 'pro' : 'free';
  } catch {
    return null;
  }
}
