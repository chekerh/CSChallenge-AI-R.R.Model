import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  compileProfileToPlainText, emptyCvBuilderProfile,
  type CvBuilderEducation, type CvBuilderExperience,
  type CvBuilderProfile, type CvBuilderProject,
} from '@utopiahire/shared';
import { useAuth } from '../contexts/AuthContext';
import { getCvBuilderDraft, publishCvBuilder, saveCvBuilderDraft } from '../lib/cvApi';
import { FileText, Eye, Save, Send, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';

function bulletsToText(bullets: string[]) { return bullets.join('\n'); }
function textToBullets(t: string) { return t.split('\n').map(s => s.trim()).filter(Boolean); }
function linesToList(t: string) { return t.split(/[\n,]+/).map(s => s.trim()).filter(Boolean); }

type Props = { onOpenCvProWithText?: (text: string) => void; onPublished?: (resumeId: string) => void; };

export default function CvBuilder({ onOpenCvProWithText, onPublished }: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState('Mon CV');
  const [profile, setProfile] = useState<CvBuilderProfile>(() => emptyCvBuilderProfile());
  const [tab, setTab] = useState<'form' | 'preview'>('form');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  const compiled = useMemo(() => compileProfileToPlainText(profile), [profile]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const r = await getCvBuilderDraft(token);
      if (cancelled) return;
      if (!r.error && r.data?.draft?.profile) {
        setProfile(r.data.draft.profile as CvBuilderProfile);
        if (r.data.draft.title) setTitle(r.data.draft.title);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const updateContact = useCallback((patch: Partial<CvBuilderProfile['contact']>) => {
    setProfile(p => ({ ...p, contact: { ...p.contact, ...patch } }));
  }, []);

  async function handleSaveDraft() {
    if (!token) return; setErr(''); setOkMsg(''); setBusy('save');
    const r = await saveCvBuilderDraft(token, { title, profile });
    setBusy(null);
    if (r.error) { setErr(r.error); return; }
    setOkMsg('Brouillon enregistré.');
  }

  async function handlePublish() {
    if (!token) return; setErr(''); setOkMsg(''); setBusy('publish');
    const r = await publishCvBuilder(token, { title, profile });
    setBusy(null);
    if (r.error) { setErr(r.error); return; }
    const rid = r.data?.resumeId;
    if (rid) onPublished?.(rid);
    setOkMsg(onPublished ? 'CV publié — vous pouvez le traiter avec l\'IA.' : 'CV publié !');
  }

  function addExperience() { setProfile(p => ({ ...p, experiences: [...p.experiences, { title: '', company: '', bullets: [] }] })); }
  function setExperience(i: number, patch: Partial<CvBuilderExperience>) { setProfile(p => { const n = [...p.experiences]; n[i] = { ...n[i], ...patch }; return { ...p, experiences: n }; }); }
  function removeExperience(i: number) { setProfile(p => ({ ...p, experiences: p.experiences.filter((_, j) => j !== i) })); }
  function addEducation() { setProfile(p => ({ ...p, education: [...p.education, { school: '', degree: '', field: '', details: '' }] })); }
  function setEducation(i: number, patch: Partial<CvBuilderEducation>) { setProfile(p => { const n = [...p.education]; n[i] = { ...n[i], ...patch }; return { ...p, education: n }; }); }
  function removeEducation(i: number) { setProfile(p => ({ ...p, education: p.education.filter((_, j) => j !== i) })); }
  function addProject() { setProfile(p => ({ ...p, projects: [...p.projects, { name: '', description: '' }] })); }
  function setProject(i: number, patch: Partial<CvBuilderProject>) { setProfile(p => { const n = [...p.projects]; n[i] = { ...n[i], ...patch }; return { ...p, projects: n }; }); }
  function removeProject(i: number) { setProfile(p => ({ ...p, projects: p.projects.filter((_, j) => j !== i) })); }

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Créateur de CV</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Construisez votre CV par blocs, prévisualisez, puis publiez.</p>
      </div>

      <div className="card p-4 border-teal-200/60 bg-teal-50/70 dark:border-teal-900/30 dark:bg-teal-950/20 flex items-start gap-3">
        <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-teal-900 dark:text-teal-300">Remplissez les blocs ci-dessous, sauvegardez un brouillon, puis publiez dans Mes CV pour le traitement IA.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(['form', 'preview'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {t === 'form' ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {t === 'form' ? 'Formulaire' : 'Aperçu'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="input-field max-w-[200px] text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du CV" />
          <button onClick={handleSaveDraft} disabled={busy !== null} className="btn-secondary text-xs">
            {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Sauver
          </button>
          <button onClick={handlePublish} disabled={busy !== null || !compiled.trim()} className="btn-primary text-xs">
            {busy === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publier
          </button>
          {onOpenCvProWithText && (
            <button onClick={() => onOpenCvProWithText(compiled)} disabled={!compiled.trim()} className="btn-secondary text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              CV Pro
            </button>
          )}
        </div>
      </div>

      {err && <div className="card p-3 border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 text-sm">{err}</div>}
      {okMsg && <div className="card p-3 border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300 text-sm">{okMsg}</div>}

      {tab === 'preview' ? (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">Aperçu texte</h2>
          {!compiled.trim() ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Remplissez au moins le nom ou une expérience.</p>
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 dark:bg-gray-950/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800 max-h-[70vh] overflow-auto text-gray-800 dark:text-gray-300">{compiled}</pre>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Contact */}
          <section className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Coordonnées</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {([['fullName', 'Nom complet'], ['email', 'Email'], ['phone', 'Téléphone'], ['city', 'Ville'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['portfolio', 'Portfolio']] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                  <input className="input-field" value={profile.contact[key] ?? ''} onChange={e => updateContact({ [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Titre / accroche</label>
              <input className="input-field" value={profile.headline ?? ''} onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Résumé</label>
              <textarea className="input-field min-h-[80px]" value={profile.summary ?? ''} onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))} />
            </div>
          </section>

          {/* Experience */}
          <section className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Expériences</h2>
              <button onClick={addExperience} className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
            </div>
            {profile.experiences.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucune expérience.</p>}
            {profile.experiences.map((ex, i) => (
              <div key={`${i}-${ex.title || ''}`} className="border border-gray-100 dark:border-gray-800/80 rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removeExperience(i)} aria-label="Supprimer l'expérience" className="absolute top-3 right-3 btn-ghost p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-3.5 h-3.5" /></button>
                <div className="grid sm:grid-cols-2 gap-3 pr-10">
                  <input className="input-field" placeholder="Intitulé du poste" value={ex.title} onChange={e => setExperience(i, { title: e.target.value })} />
                  <input className="input-field" placeholder="Entreprise" value={ex.company} onChange={e => setExperience(i, { company: e.target.value })} />
                  <input className="input-field" placeholder="Lieu" value={ex.location ?? ''} onChange={e => setExperience(i, { location: e.target.value })} />
                  <div className="flex gap-2">
                    <input className="input-field" placeholder="Début" value={ex.start ?? ''} onChange={e => setExperience(i, { start: e.target.value })} />
                    <input className="input-field" placeholder="Fin" value={ex.end ?? ''} onChange={e => setExperience(i, { end: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <input type="checkbox" checked={!!ex.current} onChange={e => setExperience(i, { current: e.target.checked })} className="rounded dark:bg-gray-800 dark:border-gray-700" />
                  Poste actuel
                </label>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Réalisations (une par ligne)</label>
                  <textarea className="input-field min-h-[60px] text-xs font-mono" value={bulletsToText(ex.bullets)} onChange={e => setExperience(i, { bullets: textToBullets(e.target.value) })} />
                </div>
              </div>
            ))}
          </section>

          {/* Education */}
          <section className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Formation</h2>
              <button onClick={addEducation} className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
            </div>
            {profile.education.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucune formation.</p>}
            {profile.education.map((ed, i) => (
              <div key={`${i}-${ed.school || ''}`} className="border border-gray-100 dark:border-gray-800/80 rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removeEducation(i)} aria-label="Supprimer la formation" className="absolute top-3 right-3 btn-ghost p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                <div className="grid sm:grid-cols-2 gap-3 pr-10">
                  <input className="input-field" placeholder="Établissement" value={ed.school} onChange={e => setEducation(i, { school: e.target.value })} />
                  <input className="input-field" placeholder="Diplôme" value={ed.degree ?? ''} onChange={e => setEducation(i, { degree: e.target.value })} />
                  <input className="input-field" placeholder="Domaine" value={ed.field ?? ''} onChange={e => setEducation(i, { field: e.target.value })} />
                  <div className="flex gap-2">
                    <input className="input-field" placeholder="Début" value={ed.start ?? ''} onChange={e => setEducation(i, { start: e.target.value })} />
                    <input className="input-field" placeholder="Fin" value={ed.end ?? ''} onChange={e => setEducation(i, { end: e.target.value })} />
                  </div>
                </div>
                <textarea className="input-field min-h-[50px] text-sm" placeholder="Détails (cours, mention…)" value={ed.details ?? ''} onChange={e => setEducation(i, { details: e.target.value })} />
              </div>
            ))}
          </section>

          {/* Projects */}
          <section className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white">Projets</h2>
              <button onClick={addProject} className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
            </div>
            {profile.projects.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucun projet.</p>}
            {profile.projects.map((pr, i) => (
              <div key={`${i}-${pr.name || ''}`} className="border border-gray-100 dark:border-gray-800/80 rounded-xl p-4 space-y-3 relative">
                <button onClick={() => removeProject(i)} aria-label="Supprimer le projet" className="absolute top-3 right-3 btn-ghost p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                <div className="space-y-3 pr-10">
                  <input className="input-field" placeholder="Nom du projet" value={pr.name} onChange={e => setProject(i, { name: e.target.value })} />
                  <textarea className="input-field min-h-[50px] text-sm" placeholder="Description" value={pr.description ?? ''} onChange={e => setProject(i, { description: e.target.value })} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input className="input-field" placeholder="Lien" value={pr.link ?? ''} onChange={e => setProject(i, { link: e.target.value })} />
                    <input className="input-field" placeholder="Stack / tech" value={pr.tech ?? ''} onChange={e => setProject(i, { tech: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Skills, Languages, Certifications */}
          <section className="card p-5 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Compétences & langues</h2>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Compétences techniques</label>
              <textarea className="input-field min-h-[60px] text-xs font-mono" value={profile.skillsTechnical.join('\n')} onChange={e => setProfile(p => ({ ...p, skillsTechnical: linesToList(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Soft skills</label>
              <textarea className="input-field min-h-[60px] text-xs font-mono" value={profile.skillsSoft.join('\n')} onChange={e => setProfile(p => ({ ...p, skillsSoft: linesToList(e.target.value) }))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Langues</label>
                <button onClick={() => setProfile(p => ({ ...p, languages: [...p.languages, { name: '' }] }))} className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400"><Plus className="w-3 h-3" /> Langue</button>
              </div>
              {profile.languages.map((lang, i) => (
                <div key={`${i}-${lang.name || ''}`} className="flex gap-2 mb-2">
                  <input className="input-field flex-1" placeholder="Langue" value={lang.name} onChange={e => { const n = [...profile.languages]; n[i] = { ...n[i], name: e.target.value }; setProfile(p => ({ ...p, languages: n })); }} />
                  <input className="input-field w-28" placeholder="Niveau" value={lang.level ?? ''} onChange={e => { const n = [...profile.languages]; n[i] = { ...n[i], level: e.target.value }; setProfile(p => ({ ...p, languages: n })); }} />
                  <button onClick={() => setProfile(p => ({ ...p, languages: p.languages.filter((_, j) => j !== i) }))} aria-label="Supprimer la langue" className="btn-ghost p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Certifications</label>
                <button onClick={() => setProfile(p => ({ ...p, certifications: [...p.certifications, { name: '', issuer: '', year: '' }] }))} className="btn-ghost text-xs text-indigo-600 dark:text-indigo-400"><Plus className="w-3 h-3" /> Certification</button>
              </div>
              {profile.certifications.map((c, i) => (
                <div key={`${i}-${c.name || ''}`} className="flex gap-2 mb-2">
                  <input className="input-field flex-1" placeholder="Certificat" value={c.name} onChange={e => { const n = [...profile.certifications]; n[i] = { ...n[i], name: e.target.value }; setProfile(p => ({ ...p, certifications: n })); }} />
                  <input className="input-field w-32" placeholder="Organisme" value={c.issuer ?? ''} onChange={e => { const n = [...profile.certifications]; n[i] = { ...n[i], issuer: e.target.value }; setProfile(p => ({ ...p, certifications: n })); }} />
                  <input className="input-field w-24" placeholder="Année" value={c.year ?? ''} onChange={e => { const n = [...profile.certifications]; n[i] = { ...n[i], year: e.target.value }; setProfile(p => ({ ...p, certifications: n })); }} />
                  <button onClick={() => setProfile(p => ({ ...p, certifications: p.certifications.filter((_, j) => j !== i) }))} aria-label="Supprimer la certification" className="btn-ghost p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Extras */}
          <section className="card p-5 space-y-3">
            <h2 className="font-bold text-gray-900 dark:text-white">Autres</h2>
            <textarea className="input-field min-h-[60px] text-xs font-mono" placeholder="Une ligne = une puce supplémentaire" value={(profile.extras ?? []).join('\n')} onChange={e => setProfile(p => ({ ...p, extras: linesToList(e.target.value) }))} />
          </section>
        </div>
      )}
    </div>
  );
}
