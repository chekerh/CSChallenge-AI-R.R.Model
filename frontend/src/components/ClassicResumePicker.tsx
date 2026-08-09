import { useEffect, useState } from 'react';
import { FileText, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/client';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  refreshKey: number;
  onListInvalidated: () => void;
};

type ResumeDto = { _id: string; title: string; created_at?: string; version_count?: number };

export default function ClassicResumePicker({ selectedId, onSelect, refreshKey, onListInvalidated }: Props) {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<ResumeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true); setError('');
    api<ResumeDto[]>('/resumes').then(setResumes).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token, refreshKey]);

  async function handleDelete(id: string) {
    if (!token) return;
    const confirmDelete = window.confirm('Voulez-vous vraiment supprimer ce CV ainsi que toutes ses versions, feedbacks et analyses ?');
    if (!confirmDelete) return;
    setDeleting(id);
    try {
      await api(`/resumes/${id}`, { method: 'DELETE' });
      if (selectedId === id) onSelect(null);
      onListInvalidated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur réseau.');
    } finally {
      setDeleting(null);
    }
  }

  const orphanCount = resumes.filter(r => !r.version_count || r.version_count === 0).length;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Mes CV</h2>
        </div>
        {resumes.length > 0 && (
          <span className="text-[10px] font-medium text-gray-400">{resumes.length} CV</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-800 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && resumes.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun CV pour le moment</p>
          <p className="text-xs text-gray-400 mt-1">Importez-en un pour commencer</p>
        </div>
      )}

      {!loading && resumes.length > 0 && (
        <div className="space-y-1 max-h-[320px] overflow-y-auto scrollbar-custom">
          {resumes.map(r => (
            <button
              key={r._id}
              type="button"
              className={`w-full flex items-center justify-between text-left gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-sm group border ${
                selectedId === r._id
                  ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/50'
                  : 'hover:bg-gray-50 border-transparent dark:hover:bg-gray-800/50'
              }`}
              onClick={() => onSelect(r._id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {r.version_count != null ? `${r.version_count} version(s)` : '—'}
                  </span>
                  {r.created_at && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); void handleDelete(r._id); }}
                disabled={deleting === r._id}
                aria-label={`Supprimer ${r.title}`}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-100 md:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-all"
                title="Supprimer"
              >
                {deleting === r._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </button>
          ))}
        </div>
      )}

      {orphanCount > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {orphanCount} CV sans version
        </div>
      )}
    </div>
  );
}
