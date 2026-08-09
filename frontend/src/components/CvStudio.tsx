import { useState, useEffect } from 'react';
import type {
  CvDiagnosisResult, CvJobMatchResult, CvOutputLanguage,
  CvRewriteSectionResult, CvTargetRole,
} from '@utopiahire/shared';
import { CV_TARGET_ROLES } from '@utopiahire/shared';
import { useAuth } from '../contexts/AuthContext';
import { getAuthPlan, postCvDiagnosis, postCvJobMatch, postCvRewriteSection } from '../lib/cvApi';
import { formatAiServiceUnavailableMessage } from '../lib/formatAiServiceError';
import { Sparkles, AlertTriangle, Target, FileEdit, Loader2, CheckCircle } from 'lucide-react';

const ROLE_LABELS: Record<CvTargetRole, string> = {
  internship: 'Stage / internship', first_job: 'Premier emploi', freelance: 'Freelance / indépendant',
  call_center: 'Call center / support client', software: 'Développement logiciel',
  data_ai: 'Data / IA', business_admin: 'Business / admin / finance', remote_international: 'Remote / international',
};

const LANG_OPTIONS: { v: CvOutputLanguage; label: string }[] = [
  { v: 'fr', label: 'Français (sortie principale)' },
  { v: 'en', label: 'English (main output)' },
  { v: 'bilingual_guidance', label: 'Guide bilingue FR/EN' },
];

const SECTION_TYPES = [
  { id: 'summary', label: 'Résumé / profil' }, { id: 'experience', label: 'Expérience (bullet)' },
  { id: 'projects', label: 'Projets' }, { id: 'education', label: 'Formation' },
  { id: 'skills', label: 'Compétences' }, { id: 'other', label: 'Autre section' },
];

type Props = { studioSeed?: { text: string; key: number } | null; onStudioSeedConsumed?: () => void };

export default function CvStudio({ studioSeed, onStudioSeedConsumed }: Props) {
  const { token } = useAuth();
  const [outputLanguage, setOutputLanguage] = useState<CvOutputLanguage>('fr');
  const [targetRole, setTargetRole] = useState<CvTargetRole>('first_job');
  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');
  const [sectionType, setSectionType] = useState('summary');
  const [sectionDraft, setSectionDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [diagnosis, setDiagnosis] = useState<CvDiagnosisResult | null>(null);
  const [diagMeta, setDiagMeta] = useState<{ truncated: boolean; upgrade_message?: string; tier: 'free' | 'pro' } | null>(null);
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [jobMatch, setJobMatch] = useState<CvJobMatchResult | null>(null);
  const [rewrite, setRewrite] = useState<CvRewriteSectionResult | null>(null);

  useEffect(() => { if (token) void getAuthPlan(token).then(setPlan); }, [token]);
  useEffect(() => {
    if (studioSeed?.text) { setCvText(studioSeed.text); onStudioSeedConsumed?.(); }
  }, [studioSeed?.key]);

  async function runDiagnosis() {
    if (!token) return; setErr(''); setBusy('diagnosis');
    const r = await postCvDiagnosis(token, cvText, outputLanguage, targetRole);
    setBusy(null);
    if (r.error) { setErr(formatAiServiceUnavailableMessage(r.error, r.status)); return; }
    if (r.data) { setDiagnosis(r.data.diagnosis); setDiagMeta({ truncated: r.data.truncated, upgrade_message: r.data.upgrade_message, tier: r.data.tier }); }
    else { setDiagnosis(null); setDiagMeta(null); }
  }

  async function runMatch() {
    if (!token) return;
    if (plan !== 'pro') { setErr('Comparaison CV ↔ offre : réservée à l\'offre Pro.'); return; }
    setErr(''); setBusy('job');
    const r = await postCvJobMatch(token, cvText, jobText, outputLanguage, targetRole); setBusy(null);
    if (r.error) { setErr(r.status === 403 ? r.error || 'Réservé Pro.' : formatAiServiceUnavailableMessage(r.error, r.status)); return; }
    setJobMatch(r.data ?? null);
  }

  async function runRewrite() {
    if (!token) return;
    if (plan !== 'pro') { setErr('Réécriture triple ton : réservée à l\'offre Pro.'); return; }
    setErr(''); setBusy('rewrite');
    const r = await postCvRewriteSection(token, { sectionType, sectionText: sectionDraft, outputLanguage, targetRole }); setBusy(null);
    if (r.error) { setErr(r.status === 403 ? r.error || 'Réservé Pro.' : formatAiServiceUnavailableMessage(r.error, r.status)); return; }
    setRewrite(r.data ?? null);
  }

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">CV Pro</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Diagnostic profond, scores expliqués, adaptation métier et comparaison aux offres.</p>
      </div>

      <div className="card p-4 border-amber-200/60 bg-amber-50/70 dark:border-amber-900/30 dark:bg-amber-950/20 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-900 dark:text-amber-300"><strong>Transparence :</strong> l'IA ne doit pas inventer d'expérience, de diplôme ou de chiffres. Vérifiez chaque suggestion.</p>
      </div>

      {plan === 'free' && (
        <div className="card p-4 border-indigo-200/60 bg-indigo-50/70 dark:border-indigo-900/30 dark:bg-indigo-950/20 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-900 dark:text-indigo-300"><strong>Compte gratuit :</strong> diagnostic disponible (aperçu limité). Comparaison aux offres et réécriture triple ton sont réservées à <strong>Pro</strong>.</p>
        </div>
      )}

      {diagMeta?.truncated && diagMeta.upgrade_message && (
        <div className="card p-4 border-purple-200/60 bg-purple-50/70 dark:border-purple-900/30 dark:bg-purple-950/20 whitespace-pre-wrap text-sm text-purple-900 dark:text-purple-300">
          {diagMeta.upgrade_message.replace(/\*\*/g, '')}
        </div>
      )}

      {/* Step 1: Language & Role */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">1</div>
          <h2 className="font-bold text-gray-900 dark:text-white">Langue & objectif</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Langue de sortie</label>
            <select className="select-field" value={outputLanguage} onChange={e => setOutputLanguage(e.target.value as CvOutputLanguage)}>
              {LANG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cible emploi</label>
            <select className="select-field" value={targetRole} onChange={e => setTargetRole(e.target.value as CvTargetRole)}>
              {CV_TARGET_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Step 2: CV Text */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">2</div>
          <h2 className="font-bold text-gray-900 dark:text-white">Votre CV</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Collez le texte extrait de votre PDF/DOCX ou saisissez-le.</p>
        <textarea className="input-field min-h-[200px] font-mono text-sm" value={cvText} onChange={e => setCvText(e.target.value)} placeholder="Collez votre CV ici…" />
        <button type="button" disabled={!cvText.trim() || busy !== null} onClick={runDiagnosis} className="btn-primary">
          {busy === 'diagnosis' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy === 'diagnosis' ? 'Analyse en cours…' : 'Lancer le diagnostic complet'}
        </button>
      </section>

      {err && (
        <div className="card p-4 border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 text-sm">{err}</div>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <section className="card p-5 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Résultats du diagnostic</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{diagnosis.executive_summary}</p>
          {diagnosis.metadata?.facts_vs_suggestions_disclaimer && (
            <p className="text-xs text-gray-500 dark:text-gray-400 border-l-4 border-gray-300 dark:border-gray-700 pl-3">{diagnosis.metadata.facts_vs_suggestions_disclaimer}</p>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Top actions prioritaires</h3>
            <ul className="space-y-1.5">
              {diagnosis.top_fixes_now.slice(0, 5).map((x, i) => (
                <li key={`fix-${i}`} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {x}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Scores par dimension</h3>
            <div className="space-y-3">
              {diagnosis.score_dimensions.map((d, i) => (
                <div key={`dim-${i}`} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.dimension}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <div className={`h-full rounded-full ${d.score >= 70 ? 'bg-emerald-500' : d.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${d.score}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{d.score}/100</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Par section</h3>
            <div className="space-y-2">
              {diagnosis.section_findings.map((s, i) => (
                <details key={`section-${i}`} className="border border-gray-100 dark:border-gray-800 rounded-lg">
                  <summary className="flex items-center justify-between p-3 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                    <span>{s.section}</span>
                    <span className={`badge text-[10px] ${s.priority === 'high' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300' : s.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                      {s.priority}
                    </span>
                  </summary>
                  <div className="px-3 pb-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Faiblesse :</strong> {s.what_is_weak}</p>
                    <p><strong>Pourquoi :</strong> {s.why_it_matters}</p>
                    <p><strong>Comment :</strong> {s.how_to_improve}</p>
                    {s.example_better_snippet && (
                      <pre className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg text-xs overflow-x-auto border border-gray-100 dark:border-gray-800">{s.example_better_snippet}</pre>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {diagnosis.tunisia_market_notes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Marché & formation (TN)</h3>
              <ul className="space-y-1">
                {diagnosis.tunisia_market_notes.map((n, i) => (
                  <li key={`market-${i}`} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {diagnosis.linkedin_headline_suggestions && diagnosis.linkedin_headline_suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Titres LinkedIn suggérés</h3>
              <ul className="space-y-1">
                {diagnosis.linkedin_headline_suggestions.map((n, i) => (
                  <li key={`linkedin-${i}`} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Step 3: Job Match */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">3</div>
          <h2 className="font-bold text-gray-900">Comparaison CV ↔ Offre</h2>
        </div>
        {plan !== 'pro' && (
          <div className="card p-3 border-amber-200/60 bg-amber-50/70">
            <p className="text-sm text-amber-900">Cette fonction nécessite un compte <strong>Pro</strong>.</p>
          </div>
        )}
        <textarea className="input-field min-h-[140px] text-sm" value={jobText} onChange={e => setJobText(e.target.value)} placeholder="Collez l'offre d'emploi ici…" />
        <button type="button" disabled={plan !== 'pro' || !cvText.trim() || !jobText.trim() || busy !== null} onClick={runMatch} className="btn-primary">
          {busy === 'job' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {busy === 'job' ? 'Comparaison…' : 'Comparer CV ↔ offre'}
        </button>
        {jobMatch && (
          <div className="space-y-3 text-sm border-t border-gray-100 pt-4 animate-fade-in">
            <p className="font-medium text-gray-900">{jobMatch.fit_summary}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Postuler ?</span>
              <span className={`badge text-[10px] ${jobMatch.should_still_apply ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {jobMatch.should_still_apply ? 'Oui' : 'Plutôt non'}
              </span>
              <span className="text-xs text-gray-500">— {jobMatch.apply_rationale}</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-xs uppercase tracking-wider">Mots-clés manquants</h4>
              <div className="flex flex-wrap gap-1.5">
                {jobMatch.keyword_gaps.map((x, i) => (
                  <span key={`gap-${i}`} className="badge bg-red-100 text-red-800 text-[10px]">{x}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1 text-xs uppercase tracking-wider">Forces à mettre en avant</h4>
              <div className="flex flex-wrap gap-1.5">
                {jobMatch.strengths_to_highlight.map((x, i) => (
                  <span key={`strength-${i}`} className="badge bg-emerald-100 text-emerald-800 text-[10px]">{x}</span>
                ))}
              </div>
            </div>
            {jobMatch.tailored_summary_draft && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1 text-xs uppercase tracking-wider">Résumé ciblé</h4>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">{jobMatch.tailored_summary_draft}</pre>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 4: Rewrite */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">4</div>
          <h2 className="font-bold text-gray-900">Réécrire une section</h2>
        </div>
        {plan !== 'pro' && (
          <div className="card p-3 border-amber-200/60 bg-amber-50/70">
            <p className="text-sm text-amber-900">Cette fonction nécessite un compte <strong>Pro</strong>.</p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Type de section</label>
            <select className="select-field" value={sectionType} onChange={e => setSectionType(e.target.value)}>
              {SECTION_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <textarea className="input-field min-h-[100px] text-sm" value={sectionDraft} onChange={e => setSectionDraft(e.target.value)} placeholder="Texte actuel de la section…" />
        <button type="button" disabled={plan !== 'pro' || !sectionDraft.trim() || busy !== null} onClick={runRewrite} className="btn-primary">
          {busy === 'rewrite' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
          {busy === 'rewrite' ? 'Réécriture…' : '3 tons : prudent / fort / premium'}
        </button>
        {rewrite && (
          <div className="space-y-4 border-t border-gray-100 pt-4 animate-fade-in">
            {rewrite.honesty_flags.length > 0 && (
              <div className="card p-3 border-amber-200 bg-amber-50 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-900">{rewrite.honesty_flags.join(' · ')}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['rewritten_conservative', 'rewritten_strong', 'rewritten_premium'] as const).map((k, i) => {
                const val = rewrite[k] as string | undefined;
                if (!val) return null;
                const label = ['Prudent', 'Fort', 'Premium'][i];
                const color = ['bg-blue-50 border-blue-100', 'bg-indigo-50 border-indigo-100', 'bg-violet-50 border-violet-100'][i];
                return (
                  <div key={k} className={`border rounded-lg p-3 ${color}`}>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{label}</h4>
                    <pre className="text-xs whitespace-pre-wrap">{val}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
