import { useState, useEffect } from 'react';
import type {
  CvDiagnosisResult,
  CvJobMatchResult,
  CvOutputLanguage,
  CvRewriteSectionResult,
  CvTargetRole,
} from '@utopiahire/shared';
import { useAuth } from '../contexts/AuthContext';
import {
  getAuthPlan,
  postCvDiagnosis,
  postCvJobMatch,
  postCvRewriteSection,
} from '../lib/cvApi';
import { formatAiServiceUnavailableMessage } from '../lib/formatAiServiceError';

/** Mirrors `CV_TARGET_ROLES` in shared (explicit list avoids CJS re-export bundler gaps). */
const CV_TARGET_ROLES: CvTargetRole[] = [
  'internship',
  'first_job',
  'freelance',
  'call_center',
  'software',
  'data_ai',
  'business_admin',
  'remote_international',
];

type CvStudioProps = {
  studioSeed?: { text: string; key: number } | null;
  onStudioSeedConsumed?: () => void;
};

const ROLE_LABELS: Record<CvTargetRole, string> = {
  internship: 'Stage / internship',
  first_job: 'Premier emploi',
  freelance: 'Freelance / indépendant',
  call_center: 'Call center / support client',
  software: 'Développement logiciel',
  data_ai: 'Data / IA',
  business_admin: 'Business / admin / finance',
  remote_international: 'Remote / international',
};

const LANG_OPTIONS: { v: CvOutputLanguage; label: string }[] = [
  { v: 'fr', label: 'Français (sortie principale)' },
  { v: 'en', label: 'English (main output)' },
  { v: 'bilingual_guidance', label: 'Guide bilingue FR/EN' },
];

const SECTION_TYPES = [
  { id: 'summary', label: 'Résumé / profil' },
  { id: 'experience', label: 'Expérience (bullet)' },
  { id: 'projects', label: 'Projets' },
  { id: 'education', label: 'Formation' },
  { id: 'skills', label: 'Compétences' },
  { id: 'other', label: 'Autre section' },
];

export default function CvStudio({
  studioSeed,
  onStudioSeedConsumed,
}: CvStudioProps) {
  const { token } = useAuth();
  const [outputLanguage, setOutputLanguage] =
    useState<CvOutputLanguage>('fr');
  const [targetRole, setTargetRole] = useState<CvTargetRole>('first_job');
  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');
  const [sectionType, setSectionType] = useState('summary');
  const [sectionDraft, setSectionDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [diagnosis, setDiagnosis] = useState<CvDiagnosisResult | null>(null);
  const [diagMeta, setDiagMeta] = useState<{
    truncated: boolean;
    upgrade_message?: string;
    tier: 'free' | 'pro';
  } | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [jobMatch, setJobMatch] = useState<CvJobMatchResult | null>(null);
  const [rewrite, setRewrite] = useState<CvRewriteSectionResult | null>(null);

  useEffect(() => {
    if (!token) return;
    void getAuthPlan(token).then(setPlan);
  }, [token]);

  useEffect(() => {
    if (studioSeed?.text) {
      setCvText(studioSeed.text);
      onStudioSeedConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new seed keys
  }, [studioSeed?.key]);

  async function runDiagnosis() {
    if (!token) return;
    setErr('');
    setBusy('diagnosis');
    const r = await postCvDiagnosis(token, cvText, outputLanguage, targetRole);
    setBusy(null);
    if (r.error) {
      setErr(formatAiServiceUnavailableMessage(r.error, r.status));
      return;
    }
    if (r.data) {
      setDiagnosis(r.data.diagnosis);
      setDiagMeta({
        truncated: r.data.truncated,
        upgrade_message: r.data.upgrade_message,
        tier: r.data.tier,
      });
    } else {
      setDiagnosis(null);
      setDiagMeta(null);
    }
  }

  async function runMatch() {
    if (!token) return;
    if (plan !== 'pro') {
      setErr(
        'Comparaison CV ↔ offre : réservée à l’offre Pro. Passez Pro pour débloquer.'
      );
      return;
    }
    setErr('');
    setBusy('job');
    const r = await postCvJobMatch(
      token,
      cvText,
      jobText,
      outputLanguage,
      targetRole
    );
    setBusy(null);
    if (r.error) {
      setErr(
        r.status === 403
          ? r.error || 'Fonction réservée à Pro.'
          : formatAiServiceUnavailableMessage(r.error, r.status)
      );
      return;
    }
    setJobMatch(r.data ?? null);
  }

  async function runRewrite() {
    if (!token) return;
    if (plan !== 'pro') {
      setErr(
        'Réécriture triple ton : réservée à l’offre Pro. Passez Pro pour débloquer.'
      );
      return;
    }
    setErr('');
    setBusy('rewrite');
    const r = await postCvRewriteSection(token, {
      sectionType,
      sectionText: sectionDraft,
      outputLanguage,
      targetRole,
    });
    setBusy(null);
    if (r.error) {
      setErr(
        r.status === 403
          ? r.error || 'Fonction réservée à Pro.'
          : formatAiServiceUnavailableMessage(r.error, r.status)
      );
      return;
    }
    setRewrite(r.data ?? null);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950">
        <strong className="font-semibold">Transparence :</strong> l’IA ne doit pas inventer
        d’expérience, de diplôme ou de chiffres. Vérifiez chaque suggestion ; les reformulations
        doivent rester fidèles à vos faits.
      </div>

      {plan === 'free' && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/90 p-4 text-sm text-indigo-950">
          <strong className="font-semibold">Compte gratuit :</strong> diagnostic disponible
          (aperçu limité). Comparaison aux offres et réécriture triple ton sont réservées à{' '}
          <strong>Pro</strong>.
        </div>
      )}

      {diagMeta?.truncated && diagMeta.upgrade_message && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/90 p-4 text-sm text-purple-950 whitespace-pre-wrap">
          {diagMeta.upgrade_message.replace(/\*\*/g, '')}
        </div>
      )}

      <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">1. Langue & objectif</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Langue de sortie
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={outputLanguage}
              onChange={(e) =>
                setOutputLanguage(e.target.value as CvOutputLanguage)
              }
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Cible emploi
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              value={targetRole}
              onChange={(e) =>
                setTargetRole(e.target.value as CvTargetRole)
              }
            >
              {CV_TARGET_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">2. Votre CV (texte)</h2>
        <p className="text-sm text-gray-600">
          Collez le texte extrait de votre PDF/DOCX ou saisissez-le. Analyse profonde, adaptée au
          marché tunisien et aux candidatures locales / internationales.
        </p>
        <textarea
          className="w-full min-h-[220px] rounded-lg border border-gray-300 p-3 font-mono text-sm"
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Votre CV…"
        />
        <button
          type="button"
          disabled={!cvText.trim() || busy !== null}
          onClick={runDiagnosis}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-teal-700 text-white font-medium disabled:opacity-50 hover:bg-teal-800"
        >
          {busy === 'diagnosis' ? 'Analyse en cours…' : 'Lancer le diagnostic complet'}
        </button>
      </section>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
          {err}
        </div>
      )}

      {diagnosis && (
        <section className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Diagnostic</h2>
          <p className="text-gray-800 leading-relaxed">{diagnosis.executive_summary}</p>
          {diagnosis.metadata?.facts_vs_suggestions_disclaimer && (
            <p className="text-xs text-gray-500 border-l-4 border-gray-300 pl-3">
              {diagnosis.metadata.facts_vs_suggestions_disclaimer}
            </p>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Top 5 actions</h3>
            <ul className="list-decimal pl-5 space-y-1 text-sm text-gray-800">
              {diagnosis.top_fixes_now.slice(0, 5).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Scores (explicables)</h3>
            <div className="space-y-3">
              {diagnosis.score_dimensions.map((d, i) => (
                <div key={i} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between font-medium text-gray-900">
                    <span>{d.dimension}</span>
                    <span>{d.score}/100</span>
                  </div>
                  <p className="text-gray-600 mt-1">{d.summary}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Par section</h3>
            <div className="space-y-3">
              {diagnosis.section_findings.map((s, i) => (
                <details key={i} className="border rounded-lg p-3 text-sm">
                  <summary className="font-medium cursor-pointer">
                    {s.section}{' '}
                    <span className="text-xs text-gray-500">({s.priority})</span>
                  </summary>
                  <p className="mt-2 text-gray-700">
                    <strong>Faiblesse :</strong> {s.what_is_weak}
                  </p>
                  <p className="mt-1 text-gray-700">
                    <strong>Pourquoi :</strong> {s.why_it_matters}
                  </p>
                  <p className="mt-1 text-gray-700">
                    <strong>Comment :</strong> {s.how_to_improve}
                  </p>
                  {s.example_better_snippet && (
                    <pre className="mt-2 bg-gray-50 p-2 rounded text-xs whitespace-pre-wrap">
                      {s.example_better_snippet}
                    </pre>
                  )}
                </details>
              ))}
            </div>
          </div>
          {diagnosis.tunisia_market_notes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Marché & formation (TN)</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {diagnosis.tunisia_market_notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          {diagnosis.linkedin_headline_suggestions &&
            diagnosis.linkedin_headline_suggestions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Idées titre LinkedIn</h3>
                <ul className="list-disc pl-5 text-sm">
                  {diagnosis.linkedin_headline_suggestions.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">3. Annonce d’emploi</h2>
        {plan !== 'pro' && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
            Cette section nécessite un compte <strong>Pro</strong>.
          </p>
        )}
        <textarea
          className="w-full min-h-[160px] rounded-lg border border-gray-300 p-3 text-sm"
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="Collez l’offre d’emploi ici…"
        />
        <button
          type="button"
          disabled={
            plan !== 'pro' ||
            !cvText.trim() ||
            !jobText.trim() ||
            busy !== null
          }
          onClick={runMatch}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-700 text-white font-medium disabled:opacity-50 hover:bg-indigo-800"
        >
          {busy === 'job' ? 'Comparaison…' : 'Comparer CV ↔ offre'}
        </button>
        {jobMatch && (
          <div className="mt-4 space-y-3 text-sm border-t pt-4">
            <p className="text-gray-800 font-medium">{jobMatch.fit_summary}</p>
            <p>
              <strong>Candidater quand même ?</strong>{' '}
              {jobMatch.should_still_apply ? 'Oui' : 'Plutôt non'} — {jobMatch.apply_rationale}
            </p>
            <div>
              <strong>Manques (mots-clés / exigences)</strong>
              <ul className="list-disc pl-5 mt-1">
                {jobMatch.keyword_gaps.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Forces à mettre en avant</strong>
              <ul className="list-disc pl-5 mt-1">
                {jobMatch.strengths_to_highlight.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            {jobMatch.tailored_summary_draft && (
              <div>
                <strong>Brouillon de résumé ciblé</strong>
                <pre className="mt-1 bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap">
                  {jobMatch.tailored_summary_draft}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">4. Réécrire une section</h2>
        {plan !== 'pro' && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
            La réécriture IA nécessite un compte <strong>Pro</strong>.
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Type de section
            <select
              className="mt-1 block w-full rounded-md border-gray-300"
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value)}
            >
              {SECTION_TYPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <textarea
          className="w-full min-h-[120px] rounded-lg border border-gray-300 p-3 text-sm"
          value={sectionDraft}
          onChange={(e) => setSectionDraft(e.target.value)}
          placeholder="Texte actuel de la section…"
        />
        <button
          type="button"
          disabled={
            plan !== 'pro' || !sectionDraft.trim() || busy !== null
          }
          onClick={runRewrite}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium disabled:opacity-50 hover:bg-slate-900"
        >
          {busy === 'rewrite' ? 'Réécriture…' : '3 tons : prudent / fort / premium'}
        </button>
        {rewrite && (
          <div className="mt-4 space-y-4 text-sm border-t pt-4">
            {rewrite.honesty_flags.length > 0 && (
              <div className="text-amber-800 bg-amber-50 p-2 rounded">
                {rewrite.honesty_flags.join(' · ')}
              </div>
            )}
            {['rewritten_conservative', 'rewritten_strong', 'rewritten_premium'].map((k) => {
              const val = rewrite[k as keyof CvRewriteSectionResult] as string | undefined;
              if (!val) return null;
              return (
                <div key={k}>
                  <strong className="text-gray-800 capitalize">
                    {k.replace('rewritten_', '')}
                  </strong>
                  <pre className="mt-1 bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap">
                    {val}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
