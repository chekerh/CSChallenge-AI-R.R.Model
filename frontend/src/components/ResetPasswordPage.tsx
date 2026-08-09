import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Key, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md card p-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Lien de réinitialisation invalide ou manquant.</p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-4">
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');

    if (password.length < 8) {
      setStatusType('error');
      setStatus('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setStatusType('error');
      setStatus('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setStatusType('success');
      setStatus('Votre mot de passe a été réinitialisé avec succès.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation.';
      setStatusType('error');
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">UtopiaHire</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {done ? 'Mot de passe réinitialisé' : 'Nouveau mot de passe'}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-indigo-100/50 dark:shadow-black/20 px-6 py-8 sm:px-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">
                Se connecter
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="password" className="sr-only">Nouveau mot de passe</label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Nouveau mot de passe"
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm" className="sr-only">Confirmer</label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      id="confirm"
                      type="password"
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Confirmer le mot de passe"
                      autoComplete="new-password"
                      minLength={8}
                    />
                  </div>
                </div>

                {status && (
                  <div className={`rounded-lg border px-4 py-3 ${
                    statusType === 'error'
                      ? 'border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20'
                      : 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20'
                  }`}>
                    <p className={`text-sm font-medium ${
                      statusType === 'error' ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'
                    }`}>{status}</p>
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Réinitialisation…</>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
