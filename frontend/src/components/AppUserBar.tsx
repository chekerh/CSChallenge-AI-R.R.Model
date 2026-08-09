import { Shield } from 'lucide-react';

interface AppUserBarProps {
  onOpenAdmin?: () => void;
  userRole?: string | null;
  userPlan?: string | null;
}

export default function AppUserBar({ onOpenAdmin, userRole, userPlan }: AppUserBarProps = {}) {
  if (!userRole) return null;

  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'support';
  const plan = userPlan === 'pro' ? 'pro' : 'free';

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <button onClick={onOpenAdmin} className="btn-ghost p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50" title="Admin">
          <Shield className="w-4 h-4" />
        </button>
      )}
      <span className={`badge ${plan === 'pro' ? 'badge-pro' : 'badge-free'}`}>
        {plan === 'pro' ? 'Pro' : 'Gratuit'}
      </span>
    </div>
  );
}
