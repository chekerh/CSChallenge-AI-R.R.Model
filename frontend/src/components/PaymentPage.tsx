import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchSubscription } from '../lib/billingApi';
import { CheckCircle, Loader2, AlertCircle, CreditCard } from 'lucide-react';

export default function PaymentPage() {
  const { token } = useAuth();
  const [sub, setSub] = useState<{ plan_code: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchSubscription(token).then(s => {
      setSub(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
    </div>
  );

  const isPro = sub?.plan_code === 'pro' && sub?.status === 'active';

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <div className="card p-8 text-center animate-scale-in">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ${isPro ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
          {isPro ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {isPro ? 'Paiement confirmé' : 'En attente de confirmation'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {isPro
            ? 'Votre abonnement Pro est actif. Vous avez accès à toutes les fonctionnalités premium.'
            : 'Votre abonnement est en cours de traitement.'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          Plan actuel : <span className="font-semibold text-gray-600 dark:text-gray-400">{sub?.plan_code || 'Gratuit'}</span>
          {sub?.status ? ` · Statut : ${sub.status}` : ''}
        </p>
        {!isPro && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Si le paiement a été effectué, rafraîchissez la page dans quelques instants.
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            <Loader2 className="w-4 h-4" /> Rafraîchir
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="btn-primary"
          >
            <CreditCard className="w-4 h-4" /> Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
