import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  listResumeVersions,
  listFeedbacksForVersion,
  processResumeVersion,
  downloadVersionText,
  deleteResume,
  type ResumeVersionDto,
  type FeedbackDto,
} from '../lib/api';
import { formatAiServiceUnavailableMessage } from '../lib/formatAiServiceError';
import { useAuth } from '../contexts/AuthContext';

function pickDisplayVersion(versions: ResumeVersionDto[]): ResumeVersionDto | null {
  if (!versions.length) return null;
  const improved = versions.filter((v) => v.version_label === 'improved');
  if (improved.length) return improved[improved.length - 1];
  return versions[versions.length - 1];
}

function latestAiSuggestions(feedbacks: FeedbackDto[]): unknown {
  const ai = feedbacks.filter((f) => f.author === 'ai');
  const last = ai[ai.length - 1];
  return last?.suggestions ?? null;
}

function renderSuggestionsBlock(suggestions: unknown): ReactNode {
  if (!suggestions) return null;
  if (typeof suggestions === 'object' && suggestions !== null) {
    const o = suggestions as Record<string, unknown>;
    const list = o.suggestions;
    if (Array.isArray(list)) {
      return (
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
          {list.map((item, i) => {
            if (item && typeof item === 'object' && 'text' in item) {
              const t = (item as { type?: string; text?: string }).text;
              const ty = (item as { type?: string }).type;
              return (
                <li key={i}>
                  {ty ? <span className="font-medium">{ty}: </span> : null}
                  {String(t ?? item)}
                </li>
              );
            }
            return <li key={i}>{JSON.stringify(item)}</li>;
          })}
        </ul>
      );
    }
    if (typeof o.improved_text === 'string' && o.improved_text) {
      return (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700">Version améliorée</p>
          <pre className="mt-1 text-xs text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded max-h-64 overflow-auto">
            {o.improved_text}
          </pre>
        </div>
      );
    }
  }
  return (
    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded max-h-64 overflow-auto">
      {JSON.stringify(suggestions, null, 2)}
    </pre>
  );
}

export default function FeedbackViewer({
  resumeId,
  onDeleted,
}: {
  resumeId: string;
  /** Called after successful DELETE so parent can clear selection and refresh lists. */
  onDeleted?: () => void;
}) {
  const { token } = useAuth();
  const [versions, setVersions] = useState<ResumeVersionDto[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentVersion = versions.find((v) => v._id === currentVersionId) ?? null;

  const loadAll = useCallback(async () => {
    if (!resumeId || !token) return;
    setIsLoading(true);
    setError('');
    try {
      const vRes = await listResumeVersions(token, resumeId);
      if ('error' in vRes) throw new Error(vRes.error);
      setVersions(vRes);
      const pick = pickDisplayVersion(vRes);
      const vid = pick?._id ?? null;
      setCurrentVersionId(vid);
      if (vid) {
        const fRes = await listFeedbacksForVersion(token, vid);
        if ('error' in fRes) throw new Error(fRes.error);
        setSuggestions(latestAiSuggestions(fRes));
      } else {
        setSuggestions(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resume');
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleProcess() {
    if (!currentVersionId || !token) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await processResumeVersion(token, currentVersionId);
      if ('error' in result) {
        setError(
          formatAiServiceUnavailableMessage(result.error, result.status)
        );
        return;
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process resume');
      console.error('Process error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadText() {
    if (!currentVersionId || !token || !currentVersion) return;
    setError('');
    const r = await downloadVersionText(token, currentVersionId);
    if ('error' in r) {
      setError(r.error);
      return;
    }
    const blob = new Blob([r.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = currentVersion.version_label.replace(/[^a-z0-9_-]/gi, '_');
    a.download = `cv-${safe}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteResume() {
    if (!token || !resumeId) return;
    if (
      !window.confirm(
        'Supprimer définitivement ce CV et toutes ses versions ? Cette action est irréversible.'
      )
    ) {
      return;
    }
    setIsLoading(true);
    setError('');
    const r = await deleteResume(token, resumeId);
    setIsLoading(false);
    if ('error' in r) {
      setError(r.error);
      return;
    }
    onDeleted?.();
  }

  return (
    <div className="space-y-6 p-6">
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-indigo-600 font-medium">Traitement…</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {currentVersion && (
        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Contenu du CV
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Version : {currentVersion.version_label}
                  {currentVersion.created_at
                    ? ` · ${new Date(currentVersion.created_at).toLocaleString()}`
                    : ''}
                </p>
              </div>
              {versions.length > 1 && (
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <span>Version</span>
                  <select
                    className="border rounded-md px-2 py-1 text-gray-900"
                    value={currentVersionId ?? ''}
                    onChange={async (e) => {
                      const id = e.target.value;
                      setCurrentVersionId(id);
                      if (token && id) {
                        const fRes = await listFeedbacksForVersion(token, id);
                        if (!('error' in fRes)) {
                          setSuggestions(latestAiSuggestions(fRes));
                        }
                      }
                    }}
                  >
                    {versions.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.version_label} ({v._id.slice(-6)})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <pre className="mt-1 text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded max-h-96 overflow-auto">
                {currentVersion.content_text}
              </pre>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleDownloadText}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Télécharger le texte (.txt)
            </button>
            <button
              type="button"
              onClick={handleProcess}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Traiter avec l’IA
            </button>
          </div>

          {suggestions != null ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Retours IA
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Suggestions structurées du dernier passage IA sur cette version.
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                {renderSuggestionsBlock(suggestions)}
              </div>
            </div>
          ) : null}

          {token ? (
            <div className="border-t border-red-100 pt-6">
              <button
                type="button"
                onClick={handleDeleteResume}
                disabled={isLoading}
                className="text-sm text-red-700 hover:text-red-900 underline disabled:opacity-50"
              >
                Supprimer ce CV du compte
              </button>
            </div>
          ) : null}
        </div>
      )}

      {!currentVersion && !isLoading && !error && (
        <div className="text-center py-12 space-y-4 px-4">
          <p className="text-sm text-gray-700 font-medium">
            Aucune version enregistrée pour ce CV.
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Cela arrive si un import a échoué ou si les données sont incomplètes. Sélectionnez un
            autre CV dans la liste à gauche, ou importez / publiez à nouveau depuis{' '}
            <strong>Créer mon CV</strong>.
          </p>
          {token ? (
            <button
              type="button"
              onClick={handleDeleteResume}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 rounded-md border border-red-300 text-sm font-medium text-red-800 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              Supprimer ce brouillon
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
