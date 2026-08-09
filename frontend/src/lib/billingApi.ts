import { API_BASE } from '../api';

function headers(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface SubscriptionDto {
  plan_code: string;
  status: string;
  provider?: string;
  current_period_end?: string;
}

export async function fetchSubscription(token: string): Promise<SubscriptionDto | null> {
  try {
    const res = await fetch(`${API_BASE}/billing/subscription`, { headers: headers(token) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createCheckoutSession(
  token: string,
  planCode: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/billing/create-checkout`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ plan_code: planCode }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Erreur de paiement' };
    return data;
  } catch {
    return { error: 'Erreur réseau' };
  }
}
