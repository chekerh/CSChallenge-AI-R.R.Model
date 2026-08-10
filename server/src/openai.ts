import './config/env';
import { isBreakerOpen, recordBreakerSuccess, recordBreakerFailure } from './services/circuitBreaker';
import { cacheKeyFor, getCachedAi, storeCachedAi } from './services/aiCache';
import { assertAiBudgetAvailable, recordAiUsage } from './services/aiCostGuard';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export function aiErrorStatus(e: unknown): number | null {
  if (e instanceof Error && (e.name === 'ServiceUnavailableError' || e.name === 'BudgetExceededError')) {
    return e.name === 'BudgetExceededError' ? 429 : 503;
  }
  return null;
}

async function assertOpenAIAvailable(): Promise<void> {
  const { open, retryAfterMs } = await isBreakerOpen('openai');
  if (open) {
    const secs = Math.max(1, Math.ceil(retryAfterMs / 1000));
    throw new ServiceUnavailableError(
      `Le service IA est temporairement indisponible. Réessayez dans ${secs}s.`
    );
  }
}

async function openaiFetch(url: string, init: RequestInit): Promise<Response> {
  await assertOpenAIAvailable();
  try {
    const resp = await fetch(url, init);
    if (resp.ok) {
      await recordBreakerSuccess('openai');
    } else {
      await recordBreakerFailure('openai');
    }
    return resp;
  } catch (err) {
    await recordBreakerFailure('openai');
    throw err;
  }
}

function tryParseJSONLike(text: string) {
  if (!text) return null;
  const jsonLike =
    /```json\s*([\s\S]*?)\s*```/.exec(text)?.[1] ||
    /({[\s\S]*})/.exec(text)?.[1] ||
    /(\[[\s\S]*?\])/.exec(text)?.[1];
  const candidate = jsonLike || text;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf('{');
    const last = candidate.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1));
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

export async function analyzeResume(
  text: string,
  opts?: { industry?: string }
) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
  const industryHint = opts?.industry
    ? `Tailor suggestions for industry: ${opts.industry}.`
    : '';
  const prompt = `Analyze the following resume and provide structured suggestions for improvement: improvements in phrasing, metrics to add, section restructuring, and provide a rewritten improved version. ${industryHint} Return JSON with keys: industry, suggestions (array of {type, text}), improved_text.`;

  const hash = cacheKeyFor({ model: OPENAI_MODEL, user: prompt + '\u0000' + text });
  const cached = await getCachedAi(hash);
  if (cached) {
    await recordAiUsage({ tokensIn: 0, tokensOut: 0, cachedHit: true });
    return { parsed: cached.parsed, raw: cached.raw, cached: true };
  }

  await assertAiBudgetAvailable();
  const resp = await openaiFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert resume reviewer who provides actionable, specific feedback.',
        },
        { role: 'user', content: `${prompt}\n\n${text}` },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    error?: { message?: string };
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  if (!resp.ok) {
    const msg = data?.error?.message || resp.statusText;
    throw new Error(`OpenAI API error: ${msg}`);
  }
  const content =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  const parsed =
    tryParseJSONLike(content) || {
      industry: null,
      suggestions: [
        {
          type: 'note',
          text:
            'Failed to parse structured suggestions; raw text provided below.',
        },
      ],
      improved_text: content,
    };
  await recordAiUsage({
    tokensIn: data?.usage?.prompt_tokens || 0,
    tokensOut: data?.usage?.completion_tokens || 0,
  });
  await storeCachedAi(hash, OPENAI_MODEL, content, parsed);
  return { parsed, raw: content, cached: false };
}

export async function openaiChatJson(input: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ parsed: unknown; raw: string; cached?: boolean }> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');

  const hash = cacheKeyFor({ model: OPENAI_MODEL, system: input.system, user: input.user });
  const cached = await getCachedAi(hash);
  if (cached) {
    await recordAiUsage({ tokensIn: 0, tokensOut: 0, cachedHit: true });
    return { parsed: cached.parsed, raw: cached.raw, cached: true };
  }

  await assertAiBudgetAvailable();
  const resp = await openaiFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
      temperature: input.temperature ?? 0.35,
      max_tokens: input.maxTokens ?? 4096,
    }),
  });
  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    error?: { message?: string };
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  if (!resp.ok) {
    const msg = data?.error?.message || resp.statusText;
    throw new Error(`OpenAI API error: ${msg}`);
  }
  const content =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  const parsed = tryParseJSONLike(content);
  await recordAiUsage({
    tokensIn: data?.usage?.prompt_tokens || 0,
    tokensOut: data?.usage?.completion_tokens || 0,
  });
  await storeCachedAi(hash, OPENAI_MODEL, content, parsed ?? { _parse_error: true, raw: content });
  return { parsed: parsed ?? { _parse_error: true, raw: content }, raw: content, cached: false };
}
