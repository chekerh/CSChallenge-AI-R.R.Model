// Deno Edge Function: process resume text with OpenAI
// Expects a JSON body: { resume_text: string, resume_version_id?: string }
import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') || '';

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const resumeText = body.resume_text as string;
    if (!resumeText) return new Response(JSON.stringify({ error: 'resume_text required' }), { status: 400 });

    const prompt = `Analyze the following resume and provide structured suggestions for improvement: improvements in phrasing, metrics to add, section restructuring, and provide a rewritten improved version. Return JSON with keys: industry, suggestions (array of {type, text}), improved_text.`;

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert resume reviewer.' },
          { role: 'user', content: `${prompt}\n\n${resumeText}` }
        ],
        temperature: 0.2,
        max_tokens: 1200
      })
    });
    const data = await openaiResp.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';

    // Try to parse JSON from model; fall back to raw text
    let parsed = { industry: null, suggestions: [], improved_text: content } as any;
    try { parsed = JSON.parse(content); } catch (e) {}

    return new Response(JSON.stringify({ ok: true, parsed, raw: content }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});
