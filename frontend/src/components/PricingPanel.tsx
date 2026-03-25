import { useEffect, useState } from 'react';
import { API_BASE } from '../api';

type Plan = {
  code: string;
  name?: string;
  description?: string;
  currency?: string;
  price_monthly?: number;
  features?: string[];
};

export default function PricingPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch(`${API_BASE}/public/plans`);
        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) {
          const o = (data ?? {}) as Record<string, unknown>;
          throw new Error(
            typeof o.error === 'string' ? o.error : 'Impossible de charger les tarifs.'
          );
        }
        if (!cancelled) setPlans(Array.isArray(data) ? (data as Plan[]) : []);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900">Tarifs</h2>
      <p className="text-sm text-gray-600 mt-1">
        Plans dynamiques pilotés depuis le panneau admin.
      </p>

      {loading ? <p className="mt-4 text-sm text-gray-500">Chargement des plans…</p> : null}
      {err ? (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div key={p.code} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{p.name || p.code}</h3>
              <span className="text-xs uppercase tracking-wide text-gray-500">{p.code}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{p.description || '—'}</p>
            <p className="mt-3 text-2xl font-bold text-indigo-700">
              {(p.price_monthly ?? 0).toString()} {p.currency || 'TND'}
              <span className="text-xs font-medium text-gray-500"> /mois</span>
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-700 list-disc pl-5">
              {(p.features || []).slice(0, 8).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

