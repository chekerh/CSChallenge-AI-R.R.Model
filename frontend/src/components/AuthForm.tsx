import { useState, useEffect } from 'react';
import { User, Key, Mail, Loader2, Sparkles, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../lib/client';
import { useLang } from '../i18n/LanguageContext';
import { getOAuthProviders, oauthLoginUrl, type OAuthProviders } from '../lib/oauth';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z"/>
    </svg>
  );
}

export default function AuthForm({ onAuth, initialMode = 'login' }: { onAuth: (token: string) => void; initialMode?: 'login' | 'signup' }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviders>({ google: false, linkedin: false });

  useEffect(() => {
    getOAuthProviders().then(setOauthProviders).catch(() => {});
  }, []);

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

        {mode !== 'forgot' && (oauthProviders.google || oauthProviders.linkedin) && (
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-3">
              {oauthProviders.google && (
                <button type="button" onClick={() => { window.location.href = oauthLoginUrl('google'); }}
                  className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all">
                  <GoogleIcon /> Continuer avec Google
                </button>
              )}
              {oauthProviders.linkedin && (
                <button type="button" onClick={() => { window.location.href = oauthLoginUrl('linkedin'); }}
                  className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all">
                  <LinkedInIcon /> Continuer avec LinkedIn
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6 mb-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">ou</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        )}

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
                className="input-field pl-10" placeholder={t('auth.email')} autoComplete="email" disabled={mode === 'forgot' && isLoading} />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10" placeholder={t('auth.password')}
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
              t('auth.login')
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
