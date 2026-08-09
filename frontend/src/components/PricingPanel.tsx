import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Check, Loader2, Sparkles, Shield, CreditCard } from 'lucide-react';
import { api } from '../lib/client';
import { createCheckoutSession } from '../lib/billingApi';

type PlanDto = {
  code: string; name?: string; description?: string; currency?: string;
  price_monthly?: number; is_public?: boolean; features?: string[]; limits?: Record<string, number>;
};

export default function PricingPanel() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    api<PlanDto[]>('/public/plans')
      .then(data => { setPlans(data); setLoading(false); })
      .catch((e) => { setLoading(false); setError(e?.message || 'Erreur chargement'); });
  }, []);

  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = useCallback(async (planCode: string) => {
    if (planCode === 'free' || !token) return;
    setSubscribing(true);
    const res = await createCheckoutSession(token, planCode);
    setSubscribing(false);
    if (res.url) window.location.href = res.url;
    else setError(res.error || 'Erreur');
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
    </div>
  );

  if (error && !subscribing) return (
    <div className="card p-5 text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20">{error}</div>
  );

  return (
    <div className="space-y-8 pb-16">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Tarifs et plans</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Choisissez le plan qui correspond à vos besoins</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {plans.map((plan, i) => (
          <div key={plan.code} className={`card p-6 flex flex-col animate-scale-in ${plan.code === 'pro' ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-indigo-200 dark:border-indigo-800' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
            {plan.code === 'pro' && (
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 rounded-full px-3 py-1 w-fit mb-4">
                <Sparkles className="w-3 h-3" /> Recommandé
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              {plan.code === 'free' ? <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500" /> : <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name || plan.code}</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description || ''}</p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{plan.price_monthly || 0}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{plan.currency || 'TND'}/mois</span>
            </div>
            {plan.features && plan.features.length > 0 && (
              <ul className="space-y-2 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => handleSubscribe(plan.code)}
              disabled={subscribing}
              className={`btn-primary w-full mt-6 ${plan.code === 'free' ? 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600' : ''} ${subscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {subscribing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Paiement en cours…</>
              ) : plan.code === 'free' ? (
                'Commencer gratuitement'
              ) : (
                <><CreditCard className="w-4 h-4" /> Passer à Pro</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
