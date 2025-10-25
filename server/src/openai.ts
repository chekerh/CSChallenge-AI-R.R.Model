import fetch from 'node-fetch';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

function tryParseJSONLike(text: string) {
  if (!text) return null;
  // try to find a JSON object or array inside the text
  const jsonLike = /```json\s*([\s\S]*?)\s*```/.exec(text)?.[1]
    || /({[\s\S]*})/.exec(text)?.[1]
    || /(\[[\s\S]*?\])/.exec(text)?.[1];
  const candidate = jsonLike || text;
  try {
    return JSON.parse(candidate);
  } catch (e) {
    // last-resort: try to locate a top-level object braces and parse that substring
    const first = candidate.indexOf('{');
    const last = candidate.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try { return JSON.parse(candidate.slice(first, last + 1)); } catch (_) {}
    }
  }
  return null;
}

export async function analyzeResume(text: string, opts?: { industry?: string }) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
  const industryHint = opts?.industry ? `Tailor suggestions for industry: ${opts.industry}.` : '';
  const prompt = `Analyze the following resume and provide structured suggestions for improvement: improvements in phrasing, metrics to add, section restructuring, and provide a rewritten improved version. ${industryHint} Return JSON with keys: industry, suggestions (array of {type, text}), improved_text.`;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert resume reviewer who provides actionable, specific feedback.' },
        { role: 'user', content: `${prompt}\n\n${text}` }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  // attempt to parse JSON from content with several fallbacks
  const parsed = tryParseJSONLike(content) || { industry: null, suggestions: [{ type: 'note', text: 'Failed to parse structured suggestions; raw text provided.' }], improved_text: content };
  return { parsed, raw: content };
}
