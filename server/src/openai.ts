import fetch from 'node-fetch';
import './config/env';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
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
  return { parsed, raw: content };
}

export async function openaiChatJson(input: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ parsed: unknown; raw: string }> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
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
  };
  if (!resp.ok) {
    const msg = data?.error?.message || resp.statusText;
    throw new Error(`OpenAI API error: ${msg}`);
  }
  const content =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  const parsed = tryParseJSONLike(content);
  return { parsed: parsed ?? { _parse_error: true, raw: content }, raw: content };
}
