// Deno Edge Function: fetch Kaggle datasets metadata using API key
// NOTE: Kaggle's traditional API is Python-based; here we do a simple HTTP fetch to the Kaggle datasets site API for metadata.
import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

const KAGGLE_USER = Deno.env.get('KAGGLE_USERNAME') || '';
const KAGGLE_KEY = Deno.env.get('KAGGLE_KEY') || '';

serve(async (req: Request) => {
  try {
    if (!KAGGLE_USER || !KAGGLE_KEY) return new Response(JSON.stringify({ error: 'kaggle credentials not set' }), { status: 500 });
    const url = 'https://www.kaggle.com/api/v1/datasets/list?search=resume+cv+job&file_type=csv';
    const auth = 'Basic ' + btoa(`${KAGGLE_USER}:${KAGGLE_KEY}`);
    const resp = await fetch(url, { headers: { Authorization: auth } });
    if (!resp.ok) return new Response(JSON.stringify({ error: 'kaggle fetch failed', status: resp.status }), { status: 502 });
    const data = await resp.json();
    // Return top 5 datasets metadata
    const top = (data || []).slice(0, 5);
    return new Response(JSON.stringify({ ok: true, datasets: top }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});
