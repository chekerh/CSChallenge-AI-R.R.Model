import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { api } from '../lib/client';
import { listResumeVersions, listFeedbacksForVersion, deleteResume, type ResumeVersionDto as VersionDto, type FeedbackDto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, Download, Trash2, MessageSquare, Sparkles, ChevronDown } from 'lucide-react';

type Props = { resumeId: string; onDeleted: () => void };

export default function FeedbackViewer({ resumeId, onDeleted }: Props) {
  const { token } = useAuth();
  const [versions, setVersions] = useState<VersionDto[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackDto[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true); setError('');
    const r = await listResumeVersions(token, resumeId);
    if ('error' in r) { setError(r.error); setLoading(false); return; }
    setVersions(r);
    setLoading(false);
  }

  useEffect(() => { load(); }, [resumeId, token]);

  async function loadFeedback(versionId: string) {
    if (!token || feedbacks[versionId]) return;
    const r = await listFeedbacksForVersion(token, versionId);
    if (!('error' in r) && Array.isArray(r)) {
      setFeedbacks(prev => ({ ...prev, [versionId]: r as FeedbackDto[] }));
    }
  }

  async function processVersion(versionId: string) {
    if (!token) return;
    setProcessing(versionId);
    setError('');
    try {
      await api<{ ok?: boolean }>(`/resumes/versions/${versionId}/process`, {
        method: 'POST', body: '{}',
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Traitement échoué';
      setError(msg);
    } finally {
      setProcessing(null);
    }
  }

  async function downloadVersion(versionId: string) {
    if (!token) return;
    const res = await fetch(`${API_BASE}/resumes/versions/${versionId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cv-${versionId.slice(-6)}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!token) return;
    const confirmDelete = window.confirm('Voulez-vous vraiment supprimer ce CV ainsi que toutes ses versions, feedbacks et analyses ?');
    if (!confirmDelete) return;
    setError('');
    const r = await deleteResume(token, resumeId);
    if ('error' in r) { setError(r.error); return; }
    onDeleted();
  }

  return (
    <div className="card divide-y divide-gray-100 dark:divide-gray-800">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Versions & Feedback</h2>
        </div>
        <button onClick={handleDelete} className="btn-ghost p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {error && (
        <div className="mx-5 mb-4 flex items-start gap-2 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && versions.length === 0 && !error && (
        <div className="text-center py-12 px-5">
          <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune version</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lancez le traitement IA pour générer des versions améliorées</p>
        </div>
      )}

      {!loading && versions.length > 0 && (
        <div className="p-5 space-y-3">
          {versions.map(v => (
            <div key={v._id} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => {
                  setExpandedVersion(expandedVersion === v._id ? null : v._id);
                  if (expandedVersion !== v._id) loadFeedback(v._id);
                }}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="badge text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">
                    {v.version_label || 'version'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(v.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${expandedVersion === v._id ? 'rotate-180' : ''}`} />
              </button>

              {expandedVersion === v._id && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-3 animate-fade-in">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap scrollbar-custom">{v.content_text || '—'}</pre>

                  <div className="flex items-center gap-2">
                    <button onClick={() => processVersion(v._id)} disabled={processing !== null} className="btn-primary text-xs px-3 py-1.5">
                      {processing === v._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {processing === v._id ? 'Traitement…' : 'Analyse IA'}
                    </button>
                    <button onClick={() => downloadVersion(v._id)} className="btn-secondary text-xs px-3 py-1.5">
                      <Download className="w-3 h-3" />
                      Télécharger
                    </button>
                  </div>

                  {feedbacks[v._id] && feedbacks[v._id].length > 0 && (
                    <div className="space-y-2">
                      {feedbacks[v._id].map((fb) => (
                        <div key={fb._id} className="bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[10px] font-medium text-indigo-800 dark:text-indigo-300 uppercase">{fb.author || 'IA'}</span>
                          </div>
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{typeof fb.suggestions === 'string' ? fb.suggestions : JSON.stringify(fb.suggestions, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
