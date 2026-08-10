import { useState } from 'react';
import { User, Key, Mail, Loader2, Sparkles, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../lib/client';

export default function AuthForm({ onAuth, initialMode = 'login' }: { onAuth: (token: string) => void; initialMode?: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      if (mode === 'forgot') {
        await api('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        setStatusType('success');
        setStatus('Si ce compte existe, un lien de réinitialisation vous a été envoyé.');
        return;
      }

      const urlPath = mode === 'signup' ? '/auth/signup' : '/auth/login';
      const body = mode === 'signup' ? { email, password, name } : { email, password };
      const data = await api<{ token: string }>(urlPath, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      localStorage.setItem('token', data.token);
      onAuth(data.token);
    } catch (err: unknown) {
      setStatusType('error');
      setStatus(err instanceof Error ? err.message : 'Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-indigo-100/50 dark:shadow-black/20 px-6 py-8 sm:px-8">
        {mode === 'forgot' && (
          <button
            onClick={() => { setMode('login'); setStatus(''); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        <div className="relative text-center mb-8">
          <div className="inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
            <Sparkles className="w-3 h-3" /> UtopiaHire
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Bon retour' : mode === 'signup' ? 'Bienvenue' : 'Mot de passe oublié ?'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login'
              ? 'Connectez-vous pour continuer'
              : mode === 'signup'
              ? 'Créez votre compte en quelques secondes'
              : 'Entrez votre email pour réinitialiser votre mot de passe'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit} noValidate>
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="sr-only">Nom</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input id="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="input-field pl-10" placeholder="Nom complet" autoComplete="name" />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field pl-10" placeholder="Adresse e-mail" autoComplete="email" disabled={mode === 'forgot' && isLoading} />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10" placeholder="Mot de passe"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button type="button" onClick={() => { setMode('forgot'); setStatus(''); }}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Mot de passe oublié ?
              </button>
            </div>
          )}

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
              <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'forgot' ? 'Envoi…' : 'Connexion…'}</>
            ) : mode === 'login' ? (
              'Se connecter'
            ) : mode === 'signup' ? (
              'Créer mon compte'
            ) : (
              'Envoyer le lien'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode !== 'signup' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => { setMode('signup'); setStatus(''); }}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                S'inscrire
              </button>
            </p>
          )}
          {mode !== 'login' && mode !== 'forgot' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Déjà inscrit ?{' '}
              <button type="button" onClick={() => { setMode('login'); setStatus(''); }}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Se connecter
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
