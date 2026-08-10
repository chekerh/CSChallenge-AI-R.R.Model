import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Modal from './ui/Modal';
import MonitoringPanel from './MonitoringPanel';
import {
  Users, CreditCard, FileText, Settings, BarChart3, ClipboardList,
  Loader2, Search, Check, Radar
} from 'lucide-react';

type AdminUserDto = { _id: string; email: string; name?: string; role?: string; plan?: string; created_at?: string; };
type AdminSettingDto = { _id?: string; key: string; type: 'string' | 'number' | 'boolean' | 'json'; value: unknown; updated_at?: string; };
type ContentBlockDto = { _id?: string; key: string; status?: 'draft' | 'published'; content?: unknown; published_content?: unknown; published_at?: string | null; updated_at?: string; };
type PlanDto = { _id?: string; code: string; name?: string; description?: string; currency?: string; price_monthly?: number; is_public?: boolean; features?: string[]; limits?: unknown; };

function pretty(v: unknown): string {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

function parseByType(type: AdminSettingDto['type'], raw: string): unknown {
  if (type === 'string') return raw;
  if (type === 'number') { const n = Number(raw); if (!Number.isFinite(n)) throw new Error('Nombre invalide'); return n; }
  if (type === 'boolean') { const s = raw.trim().toLowerCase(); if (s === 'true') return true; if (s === 'false') return false; throw new Error('Booléen invalide'); }
  return JSON.parse(raw) as unknown;
}

type Tab = 'users' | 'plans' | 'content' | 'settings' | 'analytics' | 'audit' | 'monitoring';
const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'plans', label: 'Plans', icon: CreditCard },
  { id: 'content', label: 'Contenu', icon: FileText },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audit', label: 'Audit', icon: ClipboardList },
  { id: 'monitoring', label: 'Monitoring', icon: Radar },
];

export default function AdminDashboard({ onClose }: { onClose?: () => void }) {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [settings, setSettings] = useState<AdminSettingDto[]>([]);
  const [blocks, setBlocks] = useState<ContentBlockDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [analytics, setAnalytics] = useState<unknown>(null);
  const [audit, setAudit] = useState<unknown[]>([]);

  // Modal state
  const [modal, setModal] = useState<{ type: 'setting' | 'plan' | 'content' | 'json'; item: unknown } | null>(null);
  const [editValue, setEditValue] = useState('');

  const headers = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [token]);

  async function apiGet(path: string): Promise<unknown> {
    if (!headers) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data as Record<string, unknown>)?.error as string || 'Request failed');
    return data;
  }

  async function apiPatch(path: string, body: unknown): Promise<unknown> {
    if (!headers) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data as Record<string, unknown>)?.error as string || 'Request failed');
    return data;
  }

  async function apiPost(path: string): Promise<unknown> {
    if (!headers) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data as Record<string, unknown>)?.error as string || 'Request failed');
    return data;
  }

  async function loadTab(t: Tab): Promise<void> {
    if (!headers) return;
    if (t === 'monitoring') return; // MonitoringPanel self-manages its data
    setBusy(t); setErr('');
    try {
      const data = await apiGet(`/admin/${t === 'audit' ? 'audit' : t === 'analytics' ? 'analytics' : t}`);
      if (t === 'users') setUsers(Array.isArray(data) ? data as AdminUserDto[] : (data as Record<string, unknown>)?.users as AdminUserDto[] || []);
      else if (t === 'settings') setSettings(Array.isArray(data) ? data as AdminSettingDto[] : []);
      else if (t === 'plans') setPlans(Array.isArray(data) ? data as PlanDto[] : []);
      else if (t === 'content') setBlocks(Array.isArray(data) ? data as ContentBlockDto[] : []);
      else if (t === 'analytics') setAnalytics(data);
      else if (t === 'audit') setAudit(Array.isArray(data) ? data as unknown[] : (data as Record<string, unknown>)?.items as unknown[] || []);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(null); }
  }

  useEffect(() => { void loadTab(tab); }, [tab]);

  async function setUserPlan(userId: string, plan: 'free' | 'pro') {
    if (!headers) return;
    setBusy(`plan:${userId}`); setErr('');
    try {
      const data = await apiPatch(`/admin/users/${userId}`, { plan }) as AdminUserDto;
      setUsers(prev => prev.map(u => u._id === userId ? data : u));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(null); }
  }

  function openEditSetting(item: AdminSettingDto) {
    setEditValue(item.type === 'string' ? String(item.value ?? '') : pretty(item.value));
    setModal({ type: 'setting', item });
  }

  async function saveSetting() {
    if (!modal || !headers) return;
    const item = modal.item as AdminSettingDto;
    setBusy(`setting:${item.key}`); setErr(''); setModal(null);
    try {
      const value = parseByType(item.type, editValue);
      await apiPatch(`/admin/settings/${encodeURIComponent(item.key)}`, { type: item.type, value });
      await loadTab('settings');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(null); }
  }

  function openEditPlan(item: PlanDto) {
    setEditValue(pretty({ name: item.name || item.code, description: item.description || '', price_monthly: item.price_monthly ?? 0, currency: item.currency || 'TND', is_public: item.is_public ?? true, features: item.features || [], limits: item.limits || {} }));
    setModal({ type: 'plan', item });
  }

  async function savePlan() {
    if (!modal || !headers) return;
    const item = modal.item as PlanDto;
    setBusy(`plan:${item.code}`); setErr(''); setModal(null);
    try {
      await apiPatch(`/admin/plans/${encodeURIComponent(item.code)}`, JSON.parse(editValue) as Record<string, unknown>);
      await loadTab('plans');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(null); }
  }

  function openEditContent(item: ContentBlockDto) {
    setEditValue(pretty(item.content ?? {}));
    setModal({ type: 'content', item });
  }

  async function saveContent() {
    if (!modal || !headers) return;
    const item = modal.item as ContentBlockDto;
    setBusy(`content:${item.key}`); setErr(''); setModal(null);
    try {
      await apiPatch(`/admin/content/${encodeURIComponent(item.key)}`, { content: JSON.parse(editValue) as unknown });
      await loadTab('content');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(null); }
  }

  async function publishContent(key: string) {
    if (!headers) return;
    setBusy(`publish:${key}`); setErr('');
    try {
      await apiPost(`/admin/content/${encodeURIComponent(key)}/publish`);
      await loadTab('content');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    finally { setBusy(null); }
  }

  if (!token) return null;

  return (
    <>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Administration</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des utilisateurs, plans, contenu et paramètres</p>
          </div>
          {onClose && <button onClick={onClose} className="btn-ghost">Retour</button>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {err && (
          <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-300">{err}</div>
        )}

        {tab === 'users' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input className="input-field pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher par email…" />
              </div>
              <button onClick={() => void loadTab('users')} disabled={busy === 'users'} className="btn-secondary">
                {busy === 'users' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Recharger
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left p-4 pl-5 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Nom</th>
                    <th className="text-left p-4 font-medium">Rôle</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-right p-4 pr-5 font-medium">Action</th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-t border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                        <td className="p-4 pl-5 font-medium text-gray-900 dark:text-gray-100">{u.email}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{u.name || '—'}</td>
                        <td className="p-4"><span className="badge text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{u.role || 'user'}</span></td>
                        <td className="p-4">
                          <span className={`badge text-[10px] ${u.plan === 'pro' ? 'badge-pro' : 'badge-free'}`}>{u.plan === 'pro' ? 'Pro' : 'Free'}</span>
                        </td>
                        <td className="p-4 pr-5 text-right">
                          <button onClick={() => void setUserPlan(u._id, u.plan === 'pro' ? 'free' : 'pro')}
                            disabled={busy === `plan:${u._id}`}
                            className="btn-ghost text-xs disabled:opacity-50">
                            {busy === `plan:${u._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : u.plan === 'pro' ? '→ Free' : '→ Pro'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">Aucun utilisateur</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Paramètres</h3>
              <button onClick={() => void loadTab('settings')} disabled={busy === 'settings'} className="btn-ghost text-xs">
                {busy === 'settings' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Recharger'}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {settings.map(s => (
                <div key={s.key} className="card p-4 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700" onClick={() => openEditSetting(s)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{s.key}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{s.type}</span>
                  </div>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded max-h-32 overflow-auto">{pretty(s.value)}</pre>
                </div>
              ))}
              {settings.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucun paramètre.</p>}
            </div>
          </div>
        )}

        {tab === 'plans' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Plans</h3>
              <button onClick={() => void loadTab('plans')} disabled={busy === 'plans'} className="btn-ghost text-xs">
                {busy === 'plans' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Recharger'}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plans.map(p => (
                <div key={p.code} className={`card p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 ${p.code === 'pro' ? 'ring-1 ring-indigo-200 dark:ring-indigo-700' : ''}`} onClick={() => openEditPlan(p)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{p.name || p.code}</h3>
                    <span className="badge text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{p.code}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{p.price_monthly || 0} {p.currency || 'TND'}/mois</p>
                  {p.features && p.features.length > 0 && (
                    <ul className="space-y-1">
                      {p.features.slice(0, 4).map((f, i) => (
                        <li key={`feat-${i}`} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                      {p.features.length > 4 && <li className="text-xs text-gray-400 dark:text-gray-500">+{p.features.length - 4} autres</li>}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'content' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Contenu</h3>
              <button onClick={() => void loadTab('content')} disabled={busy === 'content'} className="btn-ghost text-xs">
                {busy === 'content' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Recharger'}
              </button>
            </div>
            <div className="space-y-3">
              {blocks.map(b => (
                <div key={b.key} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{b.key}</span>
                      <span className={`badge text-[10px] ${b.status === 'published' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        {b.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditContent(b)} className="btn-ghost text-xs">Éditer</button>
                      <button onClick={() => void publishContent(b.key)} disabled={busy === `publish:${b.key}`}
                        className="btn-ghost text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 disabled:opacity-50">
                        {busy === `publish:${b.key}` ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Publier'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Brouillon</p>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded max-h-40 overflow-auto">{pretty(b.content)}</pre>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Publié</p>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-800/50 p-3 rounded max-h-40 overflow-auto">{pretty(b.published_content)}</pre>
                    </div>
                  </div>
                </div>
              ))}
              {blocks.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucun bloc.</p>}
            </div>
          </div>
        )}

        {tab === 'monitoring' && (
          <MonitoringPanel />
        )}

        {tab === 'analytics' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Analytiques</h3>
              <button onClick={() => void loadTab('analytics')} disabled={busy === 'analytics'} className="btn-ghost text-xs">
                {busy === 'analytics' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Recharger'}
              </button>
            </div>
            <pre className="card p-5 text-xs font-mono overflow-auto max-h-[500px]">{pretty(analytics)}</pre>
          </div>
        )}

        {tab === 'audit' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Audit (200 derniers)</h3>
              <button onClick={() => void loadTab('audit')} disabled={busy === 'audit'} className="btn-ghost text-xs">
                {busy === 'audit' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Recharger'}
              </button>
            </div>
            <pre className="card p-5 text-xs font-mono overflow-auto max-h-[500px]">{pretty(audit)}</pre>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.type === 'setting' ? `Paramètre : ${(modal.item as AdminSettingDto).key}`
          : modal?.type === 'plan' ? `Plan : ${(modal.item as PlanDto).code}`
          : modal?.type === 'content' ? `Contenu : ${(modal.item as ContentBlockDto).key}`
          : 'Éditeur'}>
        <div className="space-y-4">
          <textarea className="input-field font-mono text-xs min-h-[200px]" value={editValue} onChange={e => setEditValue(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(null)} className="btn-secondary">Annuler</button>
            <button onClick={() => {
              if (modal?.type === 'setting') void saveSetting();
              else if (modal?.type === 'plan') void savePlan();
              else if (modal?.type === 'content') void saveContent();
            }} className="btn-primary">
              <Check className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
