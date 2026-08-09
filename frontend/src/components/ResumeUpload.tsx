import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, Check } from 'lucide-react';
import { API_BASE } from '../api';
import { useAuth } from '../contexts/AuthContext';

type Props = { onUploaded: (id: string) => void };

export default function ResumeUpload({ onUploaded }: Props) {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [method, setMethod] = useState<'file' | 'text'>('file');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState(false);
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const inputRef = useRef<HTMLInputElement>(null);

  function showError(msg: string) { setStatusType('error'); setStatus(msg); }

  async function uploadFile() {
    if (!token || !file) return;
    setBusy(true); setStatus(''); setSuccess(false);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/resumes/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) { showError(typeof data.error === 'string' ? data.error : 'Upload échoué'); return; }
      const id = typeof data.resumeId === 'string' ? data.resumeId : '';
      if (!id) { showError('Réponse invalide'); return; }
      setSuccess(true);
      setTimeout(() => { onUploaded(id); setSuccess(false); }, 800);
    } catch { showError('Erreur réseau.'); }
    finally { setBusy(false); }
  }

  async function uploadText() {
    if (!token || !text.trim()) return;
    setBusy(true); setStatus(''); setSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/resumes/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), title: text.trim().slice(0, 60) }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) { showError(typeof data.error === 'string' ? data.error : 'Création échouée'); return; }
      const id = typeof data.resumeId === 'string' ? data.resumeId : '';
      if (!id) { showError('Réponse invalide'); return; }
      setSuccess(true);
      setTimeout(() => { onUploaded(id); setSuccess(false); setText(''); }, 800);
    } catch { showError('Erreur réseau.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Importer un CV</h2>
      </div>

      <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {(['file', 'text'] as const).map(m => (
          <button key={m} onClick={() => setMethod(m)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${method === m ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {m === 'file' ? 'Fichier' : 'Texte'}
          </button>
        ))}
      </div>

      {method === 'file' ? (
        <div>
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button onClick={() => inputRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center hover:border-indigo-300 dark:hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-all cursor-pointer">
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour choisir un fichier</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">PDF, DOCX ou TXT (max 10 Mo)</p>
              </div>
            )}
          </button>
          {file && (
            <button type="button" disabled={busy} onClick={uploadFile} className="btn-primary w-full mt-3">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {busy ? 'Importation…' : success ? 'Importé !' : 'Importer le fichier'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea className="input-field min-h-[120px] text-sm" value={text} onChange={e => setText(e.target.value)} placeholder="Collez le texte de votre CV ici…" />
          <button type="button" disabled={!text.trim() || busy} onClick={uploadText} className="btn-primary w-full">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {busy ? 'Enregistrement…' : success ? 'Enregistré !' : 'Enregistrer le texte'}
          </button>
        </div>
      )}

      {status && (
        <div className={`flex items-start gap-2 text-sm rounded-lg p-3 ${
          statusType === 'error'
            ? 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20'
            : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
        }`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {status}
        </div>
      )}
    </div>
  );
}
