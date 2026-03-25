import { useEffect, useState } from 'react';
import { fetchMe, type MeDto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AppUserBar() {
  const { token, logout } = useAuth();
  const [me, setMe] = useState<MeDto | null>(null);

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const r = await fetchMe(token);
      if (cancelled) return;
      if ('error' in r) setMe(null);
      else setMe(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return null;

  const plan = me?.plan === 'pro' ? 'pro' : 'free';

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 mb-6 text-sm">
      {me?.email ? (
        <span
          className="text-gray-600 truncate max-w-[220px] sm:max-w-xs"
          title={me.email}
        >
          {me.email}
        </span>
      ) : null}
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          plan === 'pro'
            ? 'bg-violet-100 text-violet-800'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        {plan === 'pro' ? 'Pro' : 'Gratuit'}
      </span>
      {plan === 'free' ? (
        <span className="text-xs text-gray-500 max-w-md text-right hidden md:inline">
          Passez Pro pour diagnostic complet, comparaison aux offres et réécritures.
        </span>
      ) : null}
      <button
        type="button"
        onClick={logout}
        className="text-indigo-600 hover:text-indigo-800 font-medium"
      >
        Déconnexion
      </button>
    </div>
  );
}
