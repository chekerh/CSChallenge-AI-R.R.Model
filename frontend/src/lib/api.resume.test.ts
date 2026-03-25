import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deleteResume, listResumes } from './api';

/** `api.ts` uses `res.text()` + JSON.parse, not `res.json()`. */
function mockJsonResponse(
  body: unknown,
  ok: boolean,
  status = 200
): Response {
  const raw = JSON.stringify(body);
  return {
    ok,
    status,
    text: async () => raw,
  } as Response;
}

describe('resume API helpers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deleteResume parses success JSON', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ ok: true }, true));

    const r = await deleteResume('tok', '507f1f77bcf86cd799439011');
    expect('error' in r).toBe(false);
    expect(r).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/resumes/507f1f77bcf86cd799439011');
    expect(init?.method).toBe('DELETE');
    expect((init?.headers as Record<string, string>)?.Authorization).toBe(
      'Bearer tok'
    );
  });

  it('deleteResume returns error on failure', async () => {
    fetchMock.mockResolvedValue(
      mockJsonResponse({ error: 'resume not found' }, false, 404)
    );

    const r = await deleteResume('tok', 'badid');
    expect('error' in r).toBe(true);
    if ('error' in r) {
      expect(r.error).toBe('resume not found');
      expect(r.status).toBe(404);
    }
  });

  it('listResumes returns array when OK', async () => {
    const payload = [
      {
        _id: 'a',
        title: 'T',
        version_count: 1,
      },
    ];
    fetchMock.mockResolvedValue(mockJsonResponse(payload, true));

    const r = await listResumes('tok');
    expect(Array.isArray(r)).toBe(true);
    if (Array.isArray(r)) {
      expect(r).toHaveLength(1);
      expect(r[0].version_count).toBe(1);
    }
  });
});
