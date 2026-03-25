/**
 * Shared contracts for CV Pro (Tunisia) — diagnosis, scoring, rewrite, job match.
 * AI responses may include extra keys; clients should tolerate unknown fields.
 */

export type CvOutputLanguage = 'fr' | 'en' | 'bilingual_guidance';

export type CvTargetRole =
  | 'internship'
  | 'first_job'
  | 'freelance'
  | 'call_center'
  | 'software'
  | 'data_ai'
  | 'business_admin'
  | 'remote_international';

export type RewriteTone = 'conservative' | 'strong' | 'premium';

export interface ScoreDimensionResult {
  dimension: string;
  score: number;
  summary: string;
  evidence: string[];
  improvements: string[];
}

export interface SectionFinding {
  section: string;
  what_is_weak: string;
  why_it_matters: string;
  how_to_improve: string;
  example_better_snippet?: string;
  priority: 'high' | 'medium' | 'low';
}

/** API wrapper after persistence / tier gating */
export interface CvDiagnosisApiResponse {
  diagnosis: CvDiagnosisResult;
  tier: 'free' | 'pro';
  truncated: boolean;
  upgrade_message?: string;
  analysis_id?: string;
}

export interface CvDiagnosisResult {
  executive_summary: string;
  sections_detected: string[];
  missing_sections: string[];
  top_fixes_now: string[];
  personalized_action_plan: string[];
  score_dimensions: ScoreDimensionResult[];
  section_findings: SectionFinding[];
  tunisia_market_notes: string[];
  honesty_flags: string[];
  recruiter_style_feedback: string;
  linkedin_headline_suggestions?: string[];
  cover_letter_starter_bullets?: string[];
  /** Labels for transparency */
  metadata?: {
    output_language: CvOutputLanguage;
    target_role: CvTargetRole;
    facts_vs_suggestions_disclaimer: string;
  };
}

export interface CvRewriteSectionResult {
  section: string;
  original: string;
  rewritten_conservative?: string;
  rewritten_strong?: string;
  rewritten_premium?: string;
  /** Single tone when `tone` was requested */
  rewritten?: string;
  changes_explained: string[];
  honesty_flags: string[];
  needs_user_input?: boolean;
  notes_for_user?: string[];
}

export interface CvJobMatchResult {
  fit_summary: string;
  keyword_gaps: string[];
  strengths_to_highlight: string[];
  suggested_wording_changes: string[];
  mismatch_areas: string[];
  should_still_apply: boolean;
  apply_rationale: string;
  tailored_summary_draft?: string;
  honesty_flags: string[];
}

export const CV_TARGET_ROLES: CvTargetRole[] = [
  'internship',
  'first_job',
  'freelance',
  'call_center',
  'software',
  'data_ai',
  'business_admin',
  'remote_international',
];
