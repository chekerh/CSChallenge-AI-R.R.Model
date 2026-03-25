import {
  CV_TARGET_ROLES,
  type CvDiagnosisResult,
  type CvJobMatchResult,
  type CvOutputLanguage,
  type CvRewriteSectionResult,
  type CvTargetRole,
} from '@utopiahire/shared';
import { openaiChatJson } from '../openai';
import {
  buildDiagnosisPrompt,
  buildJobMatchPrompt,
  buildRewritePrompt,
} from './prompts';

const MAX_CV_CHARS = 48_000;

export function assertTargetRole(r: string): r is CvTargetRole {
  return (CV_TARGET_ROLES as readonly string[]).includes(r);
}

export function assertOutputLanguage(
  r: string
): r is CvOutputLanguage {
  return r === 'fr' || r === 'en' || r === 'bilingual_guidance';
}

function guardCvText(text: unknown): string {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('CV text is required');
  }
  const t = text.trim();
  if (t.length > MAX_CV_CHARS) {
    throw new Error(`CV text exceeds ${MAX_CV_CHARS} characters`);
  }
  return t;
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function normalizeDiagnosis(
  raw: unknown,
  outputLanguage: CvOutputLanguage,
  targetRole: CvTargetRole
): CvDiagnosisResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const dims = asArray(o.score_dimensions).map((d) => {
    const x = d && typeof d === 'object' ? (d as Record<string, unknown>) : {};
    return {
      dimension: asString(x.dimension, 'unknown'),
      score: typeof x.score === 'number' ? Math.min(100, Math.max(0, x.score)) : 0,
      summary: asString(x.summary),
      evidence: asArray<string>(x.evidence).filter((e) => typeof e === 'string'),
      improvements: asArray<string>(x.improvements).filter(
        (e) => typeof e === 'string'
      ),
    };
  });
  const findings = asArray(o.section_findings).map((d) => {
    const x = d && typeof d === 'object' ? (d as Record<string, unknown>) : {};
    const pr = x.priority;
    const priority: 'high' | 'medium' | 'low' =
      pr === 'high' || pr === 'medium' || pr === 'low' ? pr : 'medium';
    return {
      section: asString(x.section),
      what_is_weak: asString(x.what_is_weak),
      why_it_matters: asString(x.why_it_matters),
      how_to_improve: asString(x.how_to_improve),
      example_better_snippet: asString(x.example_better_snippet),
      priority,
    };
  });
  return {
    executive_summary: asString(o.executive_summary),
    sections_detected: asArray<string>(o.sections_detected).filter(
      (s) => typeof s === 'string'
    ),
    missing_sections: asArray<string>(o.missing_sections).filter(
      (s) => typeof s === 'string'
    ),
    top_fixes_now: asArray<string>(o.top_fixes_now).filter((s) => typeof s === 'string'),
    personalized_action_plan: asArray<string>(
      o.personalized_action_plan
    ).filter((s) => typeof s === 'string'),
    score_dimensions: dims,
    section_findings: findings,
    tunisia_market_notes: asArray<string>(o.tunisia_market_notes).filter(
      (s) => typeof s === 'string'
    ),
    honesty_flags: asArray<string>(o.honesty_flags).filter(
      (s) => typeof s === 'string'
    ),
    recruiter_style_feedback: asString(o.recruiter_style_feedback),
    linkedin_headline_suggestions: asArray<string>(
      o.linkedin_headline_suggestions
    ).filter((s) => typeof s === 'string'),
    cover_letter_starter_bullets: asArray<string>(
      o.cover_letter_starter_bullets
    ).filter((s) => typeof s === 'string'),
    metadata: {
      output_language: outputLanguage,
      target_role: targetRole,
      facts_vs_suggestions_disclaimer: asString(
        (o.metadata as Record<string, unknown> | undefined)
          ?.facts_vs_suggestions_disclaimer,
        'Les formulations proposées sont des suggestions éditoriales basées uniquement sur les faits que vous avez fournis.'
      ),
    },
  };
}

export function normalizeRewrite(raw: unknown, original: string): CvRewriteSectionResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    section: asString(o.section, 'section'),
    original: asString(o.original, original),
    rewritten_conservative: asString(o.rewritten_conservative),
    rewritten_strong: asString(o.rewritten_strong),
    rewritten_premium: asString(o.rewritten_premium),
    rewritten: asString(o.rewritten),
    changes_explained: asArray<string>(o.changes_explained).filter(
      (s) => typeof s === 'string'
    ),
    honesty_flags: asArray<string>(o.honesty_flags).filter(
      (s) => typeof s === 'string'
    ),
    needs_user_input: Boolean(o.needs_user_input),
    notes_for_user: asArray<string>(o.notes_for_user).filter(
      (s) => typeof s === 'string'
    ),
  };
}

export function normalizeJobMatch(raw: unknown): CvJobMatchResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    fit_summary: asString(o.fit_summary),
    keyword_gaps: asArray<string>(o.keyword_gaps).filter((s) => typeof s === 'string'),
    strengths_to_highlight: asArray<string>(o.strengths_to_highlight).filter(
      (s) => typeof s === 'string'
    ),
    suggested_wording_changes: asArray<string>(o.suggested_wording_changes).filter(
      (s) => typeof s === 'string'
    ),
    mismatch_areas: asArray<string>(o.mismatch_areas).filter(
      (s) => typeof s === 'string'
    ),
    should_still_apply: Boolean(o.should_still_apply),
    apply_rationale: asString(o.apply_rationale),
    tailored_summary_draft: asString(o.tailored_summary_draft),
    honesty_flags: asArray<string>(o.honesty_flags).filter(
      (s) => typeof s === 'string'
    ),
  };
}

export async function runDeepDiagnosis(
  cvText: string,
  outputLanguage: CvOutputLanguage,
  targetRole: CvTargetRole
): Promise<CvDiagnosisResult> {
  const text = guardCvText(cvText);
  const { system, user } = buildDiagnosisPrompt(text, outputLanguage, targetRole);
  const { parsed } = await openaiChatJson({
    system,
    user,
    maxTokens: 8192,
    temperature: 0.35,
  });
  return normalizeDiagnosis(parsed, outputLanguage, targetRole);
}

export async function runRewriteSection(input: {
  sectionType: string;
  sectionText: string;
  outputLanguage: CvOutputLanguage;
  targetRole: CvTargetRole;
}): Promise<CvRewriteSectionResult> {
  const sectionText = guardCvText(input.sectionText);
  const { system, user } = buildRewritePrompt(
    input.sectionType,
    sectionText,
    input.outputLanguage,
    input.targetRole,
    ['conservative', 'strong', 'premium']
  );
  const { parsed } = await openaiChatJson({
    system,
    user,
    maxTokens: 4096,
    temperature: 0.4,
  });
  return normalizeRewrite(parsed, sectionText);
}

/** Free tier: same shape, reduced depth — never drop honesty_flags entirely. */
export function truncateDiagnosisForFree(
  full: CvDiagnosisResult
): CvDiagnosisResult {
  const clip = (s: string, n: number) =>
    s.length <= n ? s : `${s.slice(0, n)}…`;
  return {
    ...full,
    executive_summary: clip(full.executive_summary, 520),
    top_fixes_now: full.top_fixes_now.slice(0, 5),
    personalized_action_plan: full.personalized_action_plan.slice(0, 2),
    score_dimensions: full.score_dimensions.slice(0, 2),
    section_findings: full.section_findings.slice(0, 3),
    tunisia_market_notes: full.tunisia_market_notes.slice(0, 1),
    recruiter_style_feedback: clip(full.recruiter_style_feedback, 380),
    linkedin_headline_suggestions: [],
    cover_letter_starter_bullets: [],
    honesty_flags: full.honesty_flags.slice(0, 6),
    sections_detected: full.sections_detected.slice(0, 15),
    missing_sections: full.missing_sections.slice(0, 10),
  };
}

export async function runJobMatch(
  cvText: string,
  jobDescription: string,
  outputLanguage: CvOutputLanguage,
  targetRole: CvTargetRole
): Promise<CvJobMatchResult> {
  const cv = guardCvText(cvText);
  if (typeof jobDescription !== 'string' || !jobDescription.trim()) {
    throw new Error('Job description is required');
  }
  const jd = jobDescription.trim();
  if (jd.length > 24_000) {
    throw new Error('Job description exceeds 24000 characters');
  }
  const { system, user } = buildJobMatchPrompt(
    cv,
    jd,
    outputLanguage,
    targetRole
  );
  const { parsed } = await openaiChatJson({
    system,
    user,
    maxTokens: 6144,
    temperature: 0.35,
  });
  return normalizeJobMatch(parsed);
}
