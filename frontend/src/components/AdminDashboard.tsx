import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../api';
import { useAuth } from '../contexts/AuthContext';

type AdminUserDto = {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  plan?: string;
  created_at?: string;
};

type AdminSettingDto = {
  _id?: string;
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  value: unknown;
  updated_at?: string;
};

type ContentBlockDto = {
  _id?: string;
  key: string;
  status?: 'draft' | 'published';
  content?: unknown;
  published_content?: unknown;
  published_at?: string | null;
  updated_at?: string;
};

type PlanDto = {
  _id?: string;
  code: string;
  name?: string;
  description?: string;
  currency?: string;
  price_monthly?: number;
  is_public?: boolean;
  features?: string[];
  limits?: unknown;
};

function pretty(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function parseByType(type: AdminSettingDto['type'], raw: string): unknown {
  if (type === 'string') return raw;
  if (type === 'number') {
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new Error('Nombre invalide');
    return n;
  }
  if (type === 'boolean') {
    const s = raw.trim().toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
    throw new Error('Booléen invalide (utilisez true/false)');
  }
  return JSON.parse(raw) as unknown;
}

export default function AdminDashboard({ onClose }: { onClose?: () => void }) {
  const { token } = useAuth();
  const [tab, setTab] = useState<'users' | 'plans' | 'content' | 'settings' | 'analytics' | 'audit'>('users');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [settings, setSettings] = useState<AdminSettingDto[]>([]);
  const [blocks, setBlocks] = useState<ContentBlockDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [analytics, setAnalytics] = useState<unknown>(null);
  const [audit, setAudit] = useState<unknown[]>([]);

  const headers = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [token]);

  async function loadUsers(): Promise<void> {
    if (!headers) return;
    setBusy('users');
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/users?q=${encodeURIComponent(q)}`, { headers });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Failed to load users');
      }
      setUsers((Array.isArray(data) ? data : []) as AdminUserDto[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setBusy(null);
    }
  }

  async function loadSettings(): Promise<void> {
    if (!headers) return;
    setBusy('settings');
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, { headers });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Failed to load settings');
      }
      setSettings((Array.isArray(data) ? data : []) as AdminSettingDto[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setBusy(null);
    }
  }

  async function loadContent(): Promise<void> {
    if (!headers) return;
    setBusy('content');
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/content`, { headers });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Failed to load content');
      }
      setBlocks((Array.isArray(data) ? data : []) as ContentBlockDto[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load content');
    } finally {
      setBusy(null);
    }
  }

  async function loadAudit(): Promise<void> {
    if (!headers) return;
    setBusy('audit');
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/audit`, { headers });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Failed to load audit');
      }
      setAudit((Array.isArray(data) ? data : []) as unknown[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load audit');
    } finally {
      setBusy(null);
    }
  }

  async function loadPlans(): Promise<void> {
    if (!headers) return;
    setBusy('plans');
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/plans`, { headers });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Failed to load plans');
      }
      setPlans((Array.isArray(data) ? data : []) as PlanDto[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setBusy(null);
    }
  }

  async function loadAnalytics(): Promise<void> {
    if (!headers) return;
    setBusy('analytics');
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Failed to load analytics');
      }
      setAnalytics(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (tab === 'users') void loadUsers();
    if (tab === 'plans') void loadPlans();
    if (tab === 'settings') void loadSettings();
    if (tab === 'analytics') void loadAnalytics();
    if (tab === 'content') void loadContent();
    if (tab === 'audit') void loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function setUserPlan(userId: string, plan: 'free' | 'pro') {
    if (!headers) return;
    setBusy(`plan:${userId}`);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Update failed');
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? (data as AdminUserDto) : u))
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  }

  async function editSetting(item: AdminSettingDto): Promise<void> {
    if (!headers) return;
    const raw = window.prompt(
      `Éditer ${item.key} (${item.type})`,
      item.type === 'string' ? String(item.value ?? '') : pretty(item.value)
    );
    if (raw == null) return;
    let value: unknown;
    try {
      value = parseByType(item.type, raw);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Valeur invalide');
      return;
    }
    setBusy(`setting:${item.key}`);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/settings/${encodeURIComponent(item.key)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ type: item.type, value }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Échec mise à jour setting');
      }
      await loadSettings();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec mise à jour setting');
    } finally {
      setBusy(null);
    }
  }

  async function editPlan(plan: PlanDto): Promise<void> {
    if (!headers) return;
    const initial = pretty({
      name: plan.name || plan.code,
      description: plan.description || '',
      price_monthly: plan.price_monthly ?? 0,
      currency: plan.currency || 'TND',
      is_public: plan.is_public ?? true,
      features: plan.features || [],
      limits: plan.limits || {},
    });
    const raw = window.prompt(`Éditer plan ${plan.code} (JSON)`, initial);
    if (raw == null) return;
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      setErr('JSON invalide pour le plan');
      return;
    }
    setBusy(`planedit:${plan.code}`);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/plans/${encodeURIComponent(plan.code)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Échec mise à jour plan');
      }
      await loadPlans();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec mise à jour plan');
    } finally {
      setBusy(null);
    }
  }

  async function editContentBlock(block: ContentBlockDto): Promise<void> {
    if (!headers) return;
    const raw = window.prompt(
      `Éditer draft ${block.key} (JSON)`,
      pretty(block.content ?? {})
    );
    if (raw == null) return;
    let content: unknown;
    try {
      content = JSON.parse(raw) as unknown;
    } catch {
      setErr('JSON invalide pour le contenu');
      return;
    }
    setBusy(`content:${block.key}`);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/content/${encodeURIComponent(block.key)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ content }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Échec mise à jour contenu');
      }
      await loadContent();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec mise à jour contenu');
    } finally {
      setBusy(null);
    }
  }

  async function publishContentBlock(key: string): Promise<void> {
    if (!headers) return;
    if (!window.confirm(`Publier le bloc ${key} ?`)) return;
    setBusy(`publish:${key}`);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/content/${encodeURIComponent(key)}/publish`, {
        method: 'POST',
        headers,
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const o = (data ?? {}) as Record<string, unknown>;
        throw new Error(typeof o.error === 'string' ? o.error : 'Échec publication');
      }
      await loadContent();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Échec publication');
    } finally {
      setBusy(null);
    }
  }

  if (!token) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Admin</h2>
          <p className="text-xs text-gray-500">
            Gestion utilisateurs, contenu, paramètres et audit.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Fermer
        </button>
      </div>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {(['users', 'plans', 'content', 'settings', 'analytics', 'audit'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              tab === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t === 'users'
              ? 'Utilisateurs'
              : t === 'plans'
                ? 'Plans'
              : t === 'content'
                ? 'Contenu'
                : t === 'settings'
                  ? 'Paramètres'
                  : t === 'analytics'
                    ? 'Analytics'
                  : 'Audit'}
          </button>
        ))}
      </div>

      {err ? (
        <div className="mx-5 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <div className="p-5 space-y-4">
        {tab === 'users' ? (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="flex-1 min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher par email…"
              />
              <button
                type="button"
                onClick={() => void loadUsers()}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                disabled={busy === 'users'}
              >
                {busy === 'users' ? 'Chargement…' : 'Recharger'}
              </button>
            </div>
            <div className="overflow-auto border rounded-xl">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Nom</th>
                    <th className="text-left p-3">Rôle</th>
                    <th className="text-left p-3">Plan</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t">
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.name || '—'}</td>
                      <td className="p-3">{u.role || 'user'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.plan === 'pro' ? 'bg-violet-100 text-violet-800' : 'bg-gray-200 text-gray-700'}`}>
                          {u.plan === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void setUserPlan(u._id, u.plan === 'pro' ? 'free' : 'pro')}
                          className="text-indigo-700 hover:text-indigo-900 font-medium"
                          disabled={busy === `plan:${u._id}`}
                        >
                          {busy === `plan:${u._id}` ? '…' : u.plan === 'pro' ? 'Passer Free' : 'Passer Pro'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!users.length ? (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan={5}>
                        Aucun résultat.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {tab === 'settings' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Paramètres</h3>
              <button
                type="button"
                onClick={() => void loadSettings()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                disabled={busy === 'settings'}
              >
                {busy === 'settings' ? 'Chargement…' : 'Recharger'}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {settings.map((s) => (
                <div key={s.key} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-gray-900">{s.key}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">{s.type}</div>
                      <button
                        type="button"
                        onClick={() => void editSetting(s)}
                        className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
                        disabled={busy === `setting:${s.key}`}
                      >
                        {busy === `setting:${s.key}` ? '…' : 'Éditer'}
                      </button>
                    </div>
                  </div>
                  <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48">
                    {pretty(s.value)}
                  </pre>
                </div>
              ))}
              {!settings.length ? <div className="text-sm text-gray-500">Aucun paramètre.</div> : null}
            </div>
          </div>
        ) : null}

        {tab === 'plans' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Plans & entitlements</h3>
              <button
                type="button"
                onClick={() => void loadPlans()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                disabled={busy === 'plans'}
              >
                {busy === 'plans' ? 'Chargement…' : 'Recharger'}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {plans.map((p) => (
                <div key={p.code} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-gray-900">{p.name || p.code}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">{p.code}</div>
                      <button
                        type="button"
                        onClick={() => void editPlan(p)}
                        className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
                        disabled={busy === `planedit:${p.code}`}
                      >
                        {busy === `planedit:${p.code}` ? '…' : 'Éditer'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    {(p.price_monthly ?? 0).toString()} {p.currency || 'TND'} / mois
                  </div>
                  <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-52">
                    {pretty({ features: p.features || [], limits: p.limits || {} })}
                  </pre>
                </div>
              ))}
              {!plans.length ? <div className="text-sm text-gray-500">Aucun plan défini.</div> : null}
            </div>
          </div>
        ) : null}

        {tab === 'content' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Contenu</h3>
              <button
                type="button"
                onClick={() => void loadContent()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                disabled={busy === 'content'}
              >
                {busy === 'content' ? 'Chargement…' : 'Recharger'}
              </button>
            </div>
            <div className="space-y-3">
              {blocks.map((b) => (
                <details key={b.key} className="border rounded-xl p-3">
                  <summary className="cursor-pointer font-medium text-gray-900 flex items-center justify-between">
                    <span>{b.key}</span>
                    <span className="text-xs text-gray-500">{b.status || 'draft'}</span>
                  </summary>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void editContentBlock(b)}
                      className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
                      disabled={busy === `content:${b.key}`}
                    >
                      {busy === `content:${b.key}` ? '…' : 'Éditer draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void publishContentBlock(b.key)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                      disabled={busy === `publish:${b.key}`}
                    >
                      {busy === `publish:${b.key}` ? '…' : 'Publier'}
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-600">Draft</div>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                        {pretty(b.content)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600">Published</div>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
                        {pretty(b.published_content)}
                      </pre>
                    </div>
                  </div>
                </details>
              ))}
              {!blocks.length ? <div className="text-sm text-gray-500">Aucun bloc.</div> : null}
            </div>
          </div>
        ) : null}

        {tab === 'analytics' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <button
                type="button"
                onClick={() => void loadAnalytics()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                disabled={busy === 'analytics'}
              >
                {busy === 'analytics' ? 'Chargement…' : 'Recharger'}
              </button>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-[420px]">
              {pretty(analytics)}
            </pre>
          </div>
        ) : null}

        {tab === 'audit' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Audit (200 derniers)</h3>
              <button
                type="button"
                onClick={() => void loadAudit()}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                disabled={busy === 'audit'}
              >
                {busy === 'audit' ? 'Chargement…' : 'Recharger'}
              </button>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-[420px]">
              {pretty(audit)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

