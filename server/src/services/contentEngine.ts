import fs from 'fs';
import path from 'path';
import { openaiChatJson } from '../openai';

export interface GraphNode {
  id: string;
  label: string;
  community?: number;
  source_file?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relation?: string;
  confidence?: string;
}

interface GraphFile {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ContentPillar {
  id: number;
  label: string;
  nodes: GraphNode[];
  seed: string;
}

export interface PostDraft {
  text: string;
  community: string;
  concepts: string[];
}

export interface ReplyDraft {
  text: string;
}

const GRAPH_PATH_CANDIDATES = [
  path.resolve(__dirname, '../../../content/graphify-out/graph.json'),
  path.resolve(__dirname, '../../../../content/graphify-out/graph.json'),
  ...(process.env.CONTENT_GRAPH_PATH
    ? [path.resolve(process.env.CONTENT_GRAPH_PATH)]
    : []),
];

const CORPUS_DIR_CANDIDATES = [
  path.resolve(__dirname, '../../../content/source'),
  path.resolve(__dirname, '../../../../content/source'),
];

let cachedGraph: GraphFile | null = null;

function loadGraph(): GraphFile | null {
  if (cachedGraph) return cachedGraph;
  for (const p of GRAPH_PATH_CANDIDATES) {
    if (fs.existsSync(p)) {
      try {
        cachedGraph = JSON.parse(fs.readFileSync(p, 'utf8')) as GraphFile;
        return cachedGraph;
      } catch {
        /* try next candidate */
      }
    }
  }
  return null;
}

function loadCorpus(): string {
  for (const p of CORPUS_DIR_CANDIDATES) {
    if (fs.existsSync(p)) {
      try {
        const files = fs
          .readdirSync(p)
          .filter((f) => f.endsWith('.md'))
          .map((f) => fs.readFileSync(path.join(p, f), 'utf8'))
          .join('\n\n');
        if (files.trim()) return files.slice(0, 20_000);
      } catch {
        /* try next candidate */
      }
    }
  }
  return '';
}

export function buildPillars(nodes: GraphNode[]): ContentPillar[] {
  const byCommunity = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const c = node.community ?? 0;
    const list = byCommunity.get(c) || [];
    list.push(node);
    byCommunity.set(c, list);
  }
  return [...byCommunity.entries()]
    .map(([id, group]) => ({
      id,
      label: pillarLabel(id),
      nodes: group,
      seed: pickSeed(group),
    }))
    .filter((p) => p.seed);
}

function pillarLabel(id: number): string {
  const known: Record<number, string> = {
    0: 'Candidate Toolkit & Audience',
    1: 'Brand Voice & Editorial Rules',
    2: 'ATS & Tailoring',
    3: 'Job Search Funnel',
    4: 'AI Diagnosis Engine',
    5: 'Payments & Security',
    6: 'Plans & Usage Limits',
    7: 'Bilingual CV Craft',
    8: 'Subscription Philosophy',
  };
  return known[id] || `Content Pillar ${id}`;
}

function pickSeed(nodes: GraphNode[]): string {
  const preferred = nodes.find((n) =>
    /utopiahire|diagnosis|ats|funnel|bilingual|tnd|free plan|agents|rewrite|match|voice/i.test(
      n.label
    )
  );
  return (preferred || nodes[0])?.label || '';
}

export interface Angle {
  claim: string;
  supporting: string[];
  tone: string;
}

export function pickAngle(
  pillars: ContentPillar[],
  rng: () => number = Math.random
): Angle | null {
  const usable = pillars.filter((p) => p.nodes.length >= 2 && p.id !== 1);
  if (usable.length === 0) return null;
  const pillar = usable[Math.floor(rng() * usable.length)];
  const claim = pillar.seed;
  const supporting = pillar.nodes
    .map((n) => n.label)
    .filter((l) => l && l !== claim)
    .slice(0, 4);
  const tones = ['balanced', 'diagnostic', 'anti-hype'];
  const tone = tones[Math.floor(rng() * tones.length)];
  return { claim, supporting, tone };
}

const BANNED_PHRASES = [
  'in today\u2019s rapidly evolving landscape',
  "in today's rapidly evolving landscape",
  'game-changer',
  'revolutionary',
  'cutting-edge',
  'unlock the power',
  'here\u2019s why this matters',
  "here's why this matters",
  'just a thought dump',
  'praise-stacking',
];

export function findBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((p) => lower.includes(p.toLowerCase()));
}

export function sanitizePost(text: string): string {
  let t = text.trim();
  t = t.replace(/\n{3,}/g, '\n\n');
  if (t.length > 3000) t = t.slice(0, 3000);
  if (!/[.!?…"']$/.test(t)) t += '.';
  return t;
}

export function pickIdeaSource(
  rng: () => number = Math.random
): 'graph' | 'corpus' {
  return rng() < 0.7 ? 'graph' : 'corpus';
}

async function generatePostRaw(input: {
  claim: string;
  supporting: string[];
  tone: string;
  corpus: string;
  history: string[];
}): Promise<string> {
  const { parsed } = await openaiChatJson({
    temperature: 0.8,
    maxTokens: 700,
    system: [
      'You write LinkedIn posts for UtopiaHire, an AI resume review and job-search platform for Tunisian and international job seekers.',
      'VOICE CONTRACT (non-negotiable):',
      '- Specific before loud: state one concrete observation, mechanism, or fact. Adjectives are not evidence.',
      '- One post, one claim: advance exactly one idea.',
      '- Practitioner voice: calm, honest, no marketing hype, no exclamation stacking.',
      '- Honest about limits: we do not promise interviews.',
      'HARD BANS (delete any of these if present): "in today\'s rapidly evolving landscape", "game-changer", "revolutionary", "cutting-edge", "unlock the power", ending with a fake question to farm replies, forced casualness, praise-stacking, journey filler.',
      'STRUCTURE: open with the strongest claim or tension. Expand just enough for someone outside the niche to follow. One idea per paragraph, short lines. 90-250 words. No emoji spam, no hashtag spam (max 3 hashtags).',
      'Return ONLY valid JSON: {"text": "the full post"}',
    ].join('\n'),
    user: [
      `Tone: ${input.tone}`,
      `Main claim to build the post around: "${input.claim}"`,
      `Supporting facts (use only ones that fit the claim, ignore irrelevant ones):`,
      input.supporting.map((s) => `- ${s}`).join('\n'),
      `Source material for grounding (excerpt):`,
      input.corpus.slice(0, 8000),
      `Recently published post ideas (do not repeat these):`,
      input.history.join('\n'),
      'Write the post.',
    ].join('\n\n'),
  });
  const obj = parsed as { text?: string } | null;
  if (!obj?.text) {
    throw new Error('Content generation returned no text');
  }
  return obj.text;
}

export async function generatePost(input: {
  tone?: string;
  recent?: string[];
  rng?: () => number;
}): Promise<PostDraft> {
  const rng = input.rng || Math.random;
  const graph = loadGraph();
  const corpus = loadCorpus();
  const history = (input.recent || []).map((t) => t.slice(0, 200));
  const tone = input.tone || 'balanced';

  const ideaSource = pickIdeaSource(rng);
  let claim = '';
  let supporting: string[] = [];
  let community = '';

  const pillars = graph ? buildPillars(graph.nodes) : [];
  const angle = graph ? pickAngle(pillars, rng) : null;

  if (ideaSource === 'graph' && angle) {
    claim = angle.claim;
    supporting = angle.supporting;
    community = 'knowledge graph';
  }

  if (!claim) {
    const ideas = corpus
      .split('\n')
      .map((l) => l.replace(/^[-*]\s*/, '').trim())
      .filter((l) => /ats|resume|cv|funnel|bilingual|tnd|agent|interview|diagnos|rewrite|match/i.test(l));
    claim = ideas[Math.floor(rng() * ideas.length)] || 'How job search actually works';
    supporting = ideas.slice(0, 4);
    community = 'source corpus';
  }

  const effectiveTone = input.tone || (angle ? angle.tone : 'balanced');

  try {
    let text = sanitizePost(
      await generatePostRaw({ claim, supporting, tone: effectiveTone, corpus, history })
    );
    let attempts = 0;
    while (findBannedPhrases(text).length > 0 && attempts < 2) {
      attempts += 1;
      text = sanitizePost(
        await generatePostRaw({ claim, supporting, tone: effectiveTone, corpus, history })
      );
    }
    return {
      text,
      community: community || angle?.tone || 'source corpus',
      concepts: [claim, ...supporting].slice(0, 5),
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes('OPENAI_API_KEY')) throw err;
    throw new Error(
      `Content generation failed: ${err instanceof Error ? err.message : 'unknown error'}`
    );
  }
}

export async function draftReply(input: {
  comment: string;
  authorName?: string;
}): Promise<ReplyDraft> {
  const { parsed } = await openaiChatJson({
    temperature: 0.6,
    maxTokens: 300,
    system: [
      'You reply to LinkedIn comments on behalf of UtopiaHire, an AI resume review and job-search platform.',
      'Voice: short, specific, human. No marketing copy, no emoji, no exclamation marks stacking.',
      'If the comment is a question, answer it concretely or offer a useful next step. If it is praise, thank them and add one specific remark. If it is criticism, acknowledge and stay calm.',
      'Return ONLY valid JSON: {"text": "the reply"}. 10-45 words.',
    ].join('\n'),
    user: `Comment${input.authorName ? ` from ${input.authorName}` : ''}:\n"${input.comment.slice(0, 1000)}"\n\nWrite the reply.`,
  });
  const obj = parsed as { text?: string } | null;
  if (!obj?.text) throw new Error('Reply generation returned no text');
  return { text: obj.text.trim() };
}

export function getContentPillars(): { id: number; label: string; nodes: number }[] {
  const graph = loadGraph();
  if (!graph) return [];
  return buildPillars(graph.nodes).map((p) => ({
    id: p.id,
    label: p.label,
    nodes: p.nodes.length,
  }));
}
