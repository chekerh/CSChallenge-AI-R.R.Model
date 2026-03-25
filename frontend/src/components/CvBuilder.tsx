import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  compileProfileToPlainText,
  emptyCvBuilderProfile,
  type CvBuilderEducation,
  type CvBuilderExperience,
  type CvBuilderProfile,
  type CvBuilderProject,
} from '@utopiahire/shared';
import { useAuth } from '../contexts/AuthContext';
import {
  getCvBuilderDraft,
  publishCvBuilder,
  saveCvBuilderDraft,
} from '../lib/cvApi';

function bulletsToText(bullets: string[]) {
  return bullets.join('\n');
}

function textToBullets(t: string) {
  return t
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToList(t: string) {
  return t
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  onOpenCvProWithText?: (text: string) => void;
  /** After publish, parent can open classic mode and select the new resume. */
  onPublished?: (resumeId: string) => void;
};

export default function CvBuilder({
  onOpenCvProWithText,
  onPublished,
}: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState('Mon CV');
  const [profile, setProfile] = useState<CvBuilderProfile>(() =>
    emptyCvBuilderProfile()
  );
  const [tab, setTab] = useState<'form' | 'preview'>('form');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  const compiled = useMemo(
    () => compileProfileToPlainText(profile),
    [profile]
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const r = await getCvBuilderDraft(token);
      if (cancelled) return;
      if (r.error) {
        setLoaded(true);
        return;
      }
      const d = r.data?.draft;
      if (d?.profile) {
        setProfile(d.profile as CvBuilderProfile);
        if (d.title) setTitle(d.title);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateContact = useCallback(
    (patch: Partial<CvBuilderProfile['contact']>) => {
      setProfile((p) => ({
        ...p,
        contact: { ...p.contact, ...patch },
      }));
    },
    []
  );

  async function handleSaveDraft() {
    if (!token) return;
    setErr('');
    setOkMsg('');
    setBusy('save');
    const r = await saveCvBuilderDraft(token, { title, profile });
    setBusy(null);
    if (r.error) {
      setErr(r.error);
      return;
    }
    setOkMsg('Brouillon enregistré.');
  }

  async function handlePublish() {
    if (!token) return;
    setErr('');
    setOkMsg('');
    setBusy('publish');
    const r = await publishCvBuilder(token, { title, profile });
    setBusy(null);
    if (r.error) {
      setErr(r.error);
      return;
    }
    const rid = r.data?.resumeId;
    if (rid) onPublished?.(rid);
    setOkMsg(
      onPublished
        ? 'CV publié — bascule vers le mode classique pour le traitement IA.'
        : `CV publié. Ouvrez le mode classique et choisissez ce CV pour le feedback IA.`
    );
  }

  function addExperience() {
    setProfile((p) => ({
      ...p,
      experiences: [
        ...p.experiences,
        {
          title: '',
          company: '',
          bullets: [],
        },
      ],
    }));
  }

  function setExperience(i: number, patch: Partial<CvBuilderExperience>) {
    setProfile((p) => {
      const next = [...p.experiences];
      next[i] = { ...next[i], ...patch };
      return { ...p, experiences: next };
    });
  }

  function removeExperience(i: number) {
    setProfile((p) => ({
      ...p,
      experiences: p.experiences.filter((_, j) => j !== i),
    }));
  }

  function addEducation() {
    setProfile((p) => ({
      ...p,
      education: [
        ...p.education,
        { school: '', degree: '', field: '', details: '' },
      ],
    }));
  }

  function setEducation(i: number, patch: Partial<CvBuilderEducation>) {
    setProfile((p) => {
      const next = [...p.education];
      next[i] = { ...next[i], ...patch };
      return { ...p, education: next };
    });
  }

  function removeEducation(i: number) {
    setProfile((p) => ({
      ...p,
      education: p.education.filter((_, j) => j !== i),
    }));
  }

  function addProject() {
    setProfile((p) => ({
      ...p,
      projects: [...p.projects, { name: '', description: '' }],
    }));
  }

  function setProject(i: number, patch: Partial<CvBuilderProject>) {
    setProfile((p) => {
      const next = [...p.projects];
      next[i] = { ...next[i], ...patch };
      return { ...p, projects: next };
    });
  }

  function removeProject(i: number) {
    setProfile((p) => ({
      ...p,
      projects: p.projects.filter((_, j) => j !== i),
    }));
  }

  if (!loaded) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-gray-600">
        Chargement du brouillon…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="rounded-2xl border border-teal-200/80 bg-teal-50/80 p-4 text-sm text-teal-950">
        <strong className="font-semibold">Créateur de CV</strong> — remplissez les blocs,
        enregistrez un brouillon, prévisualisez le texte, puis publiez dans « Mes CV » pour
        le mode classique ou envoyez le texte vers CV Pro pour un diagnostic.
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('form')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'form'
                ? 'bg-teal-700 text-white'
                : 'bg-white border border-gray-300 text-gray-800'
            }`}
          >
            Formulaire
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'preview'
                ? 'bg-teal-700 text-white'
                : 'bg-white border border-gray-300 text-gray-800'
            }`}
          >
            Aperçu texte
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === 'save' ? '…' : 'Sauver brouillon'}
          </button>
          <button
            type="button"
            disabled={busy !== null || !compiled.trim()}
            onClick={handlePublish}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-indigo-700"
          >
            {busy === 'publish' ? '…' : 'Publier dans mes CV'}
          </button>
          {onOpenCvProWithText && (
            <button
              type="button"
              disabled={!compiled.trim()}
              onClick={() => onOpenCvProWithText(compiled)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium disabled:opacity-50 hover:bg-slate-900"
            >
              Analyser dans CV Pro
            </button>
          )}
        </div>
      </div>

      <label className="block text-sm font-medium text-gray-700">
        Titre du document
        <input
          className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          {err}
        </div>
      )}
      {okMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-sm">
          {okMsg}
        </div>
      )}

      {tab === 'preview' ? (
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Texte compilé</h2>
          {!compiled.trim() ? (
            <p className="text-gray-500 text-sm">
              Remplissez au moins le nom ou une expérience pour générer du texte.
            </p>
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[70vh] overflow-auto">
              {compiled}
            </pre>
          )}
        </section>
      ) : (
        <div className="space-y-8">
          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Coordonnées</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(
                [
                  ['fullName', 'Nom complet'],
                  ['email', 'Email'],
                  ['phone', 'Téléphone'],
                  ['city', 'Ville'],
                  ['linkedin', 'LinkedIn'],
                  ['github', 'GitHub'],
                  ['portfolio', 'Portfolio / site'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm text-gray-700">
                  {label}
                  <input
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={profile.contact[key] ?? ''}
                    onChange={(e) => updateContact({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Profil</h2>
            <label className="block text-sm text-gray-700">
              Titre / accroche
              <input
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                value={profile.headline ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, headline: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm text-gray-700">
              Résumé
              <textarea
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[100px]"
                value={profile.summary ?? ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, summary: e.target.value }))
                }
              />
            </label>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Expériences</h2>
              <button
                type="button"
                onClick={addExperience}
                className="text-sm text-teal-700 font-medium hover:underline"
              >
                + Ajouter
              </button>
            </div>
            {profile.experiences.length === 0 && (
              <p className="text-sm text-gray-500">Aucune expérience pour l’instant.</p>
            )}
            {profile.experiences.map((ex, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="absolute top-3 right-3 text-xs text-red-600 hover:underline"
                >
                  Retirer
                </button>
                <div className="grid sm:grid-cols-2 gap-3 pr-16">
                  <input
                    placeholder="Intitulé du poste"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ex.title}
                    onChange={(e) => setExperience(i, { title: e.target.value })}
                  />
                  <input
                    placeholder="Entreprise"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ex.company}
                    onChange={(e) =>
                      setExperience(i, { company: e.target.value })
                    }
                  />
                  <input
                    placeholder="Lieu"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ex.location ?? ''}
                    onChange={(e) =>
                      setExperience(i, { location: e.target.value })
                    }
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="Début"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={ex.start ?? ''}
                      onChange={(e) =>
                        setExperience(i, { start: e.target.value })
                      }
                    />
                    <input
                      placeholder="Fin"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={ex.end ?? ''}
                      onChange={(e) => setExperience(i, { end: e.target.value })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!ex.current}
                    onChange={(e) =>
                      setExperience(i, { current: e.target.checked })
                    }
                  />
                  Poste actuel
                </label>
                <label className="block text-sm text-gray-700">
                  Réalisations (une ligne = une puce)
                  <textarea
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px] font-mono"
                    value={bulletsToText(ex.bullets)}
                    onChange={(e) =>
                      setExperience(i, { bullets: textToBullets(e.target.value) })
                    }
                  />
                </label>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Formation</h2>
              <button
                type="button"
                onClick={addEducation}
                className="text-sm text-teal-700 font-medium hover:underline"
              >
                + Ajouter
              </button>
            </div>
            {profile.education.map((ed, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => removeEducation(i)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Retirer
                </button>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Établissement *"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ed.school}
                    onChange={(e) => setEducation(i, { school: e.target.value })}
                  />
                  <input
                    placeholder="Diplôme"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ed.degree ?? ''}
                    onChange={(e) =>
                      setEducation(i, { degree: e.target.value })
                    }
                  />
                  <input
                    placeholder="Domaine"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ed.field ?? ''}
                    onChange={(e) => setEducation(i, { field: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Début"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={ed.start ?? ''}
                      onChange={(e) =>
                        setEducation(i, { start: e.target.value })
                      }
                    />
                    <input
                      placeholder="Fin"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      value={ed.end ?? ''}
                      onChange={(e) => setEducation(i, { end: e.target.value })}
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Détails (cours, mention…)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
                  value={ed.details ?? ''}
                  onChange={(e) =>
                    setEducation(i, { details: e.target.value })
                  }
                />
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Projets</h2>
              <button
                type="button"
                onClick={addProject}
                className="text-sm text-teal-700 font-medium hover:underline"
              >
                + Ajouter
              </button>
            </div>
            {profile.projects.map((pr, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => removeProject(i)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Retirer
                </button>
                <input
                  placeholder="Nom du projet"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={pr.name}
                  onChange={(e) => setProject(i, { name: e.target.value })}
                />
                <textarea
                  placeholder="Description"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
                  value={pr.description ?? ''}
                  onChange={(e) =>
                    setProject(i, { description: e.target.value })
                  }
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    placeholder="Lien"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={pr.link ?? ''}
                    onChange={(e) => setProject(i, { link: e.target.value })}
                  />
                  <input
                    placeholder="Stack / tech"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={pr.tech ?? ''}
                    onChange={(e) => setProject(i, { tech: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Compétences & langues</h2>
            <label className="block text-sm text-gray-700">
              Compétences techniques (virgules ou lignes)
              <textarea
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[72px] font-mono"
                value={profile.skillsTechnical.join('\n')}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    skillsTechnical: linesToList(e.target.value),
                  }))
                }
              />
            </label>
            <label className="block text-sm text-gray-700">
              Soft skills
              <textarea
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[72px] font-mono"
                value={profile.skillsSoft.join('\n')}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    skillsSoft: linesToList(e.target.value),
                  }))
                }
              />
            </label>
            <p className="text-sm font-medium text-gray-800">Langues</p>
            {profile.languages.map((lang, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Langue"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={lang.name}
                  onChange={(e) => {
                    const next = [...profile.languages];
                    next[i] = { ...next[i], name: e.target.value };
                    setProfile((p) => ({ ...p, languages: next }));
                  }}
                />
                <input
                  placeholder="Niveau"
                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={lang.level ?? ''}
                  onChange={(e) => {
                    const next = [...profile.languages];
                    next[i] = { ...next[i], level: e.target.value };
                    setProfile((p) => ({ ...p, languages: next }));
                  }}
                />
                <button
                  type="button"
                  className="text-red-600 text-sm px-2"
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      languages: p.languages.filter((_, j) => j !== i),
                    }))
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  languages: [...p.languages, { name: '' }],
                }))
              }
              className="text-sm text-teal-700 font-medium hover:underline"
            >
              + Langue
            </button>

            <p className="text-sm font-medium text-gray-800 pt-2">Certifications</p>
            {profile.certifications.map((c, i) => (
              <div key={i} className="grid sm:grid-cols-3 gap-2">
                <input
                  placeholder="Certificat"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={c.name}
                  onChange={(e) => {
                    const next = [...profile.certifications];
                    next[i] = { ...next[i], name: e.target.value };
                    setProfile((p) => ({ ...p, certifications: next }));
                  }}
                />
                <input
                  placeholder="Organisme"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={c.issuer ?? ''}
                  onChange={(e) => {
                    const next = [...profile.certifications];
                    next[i] = { ...next[i], issuer: e.target.value };
                    setProfile((p) => ({ ...p, certifications: next }));
                  }}
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Année"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={c.year ?? ''}
                    onChange={(e) => {
                      const next = [...profile.certifications];
                      next[i] = { ...next[i], year: e.target.value };
                      setProfile((p) => ({ ...p, certifications: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="text-red-600 text-sm"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        certifications: p.certifications.filter(
                          (_, j) => j !== i
                        ),
                      }))
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  certifications: [
                    ...p.certifications,
                    { name: '', issuer: '', year: '' },
                  ],
                }))
              }
              className="text-sm text-teal-700 font-medium hover:underline"
            >
              + Certification
            </button>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-6 space-y-2">
            <h2 className="text-lg font-bold text-gray-900">Autres (lignes libres)</h2>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px] font-mono"
              placeholder="Une ligne = une puce en bas du CV"
              value={(profile.extras ?? []).join('\n')}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  extras: linesToList(e.target.value),
                }))
              }
            />
          </section>
        </div>
      )}
    </div>
  );
}
