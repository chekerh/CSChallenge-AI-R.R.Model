import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Activity, AlertTriangle, CheckCircle2, HeartPulse, Loader2,
  Play, Radar, ShieldAlert, XCircle, Zap, RefreshCw,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://127.0.0.1:4000';

interface WorkerStatus {
  running: boolean;
  last_detection: string | null;
  last_self_heal: string | null;
  started_at: string | null;
  interval_ms: number;
}

interface OverviewDto {
  now: string;
  errors_24h: number;
  errors_1h: number;
  open_incidents: number;
  open_critical: number;
  heal_actions_24h: number;
  events_24h: number;
  logins_24h: number;
  signups_24h: number;
  recent_incidents: IncidentDto[];
  recent_errors: ErrorDto[];
  worker: WorkerStatus;
}

interface EventDto { _id: string; event: string; props?: Record<string, unknown>; user_id?: string | null; created_at: string; }
interface ErrorDto {
  _id: string; request_id?: string; path?: string; method?: string; status_code?: number;
  error_name?: string; message?: string; code?: string; user_id?: string | null; ip?: string; created_at: string;
}
interface IncidentDto {
  _id: string; title: string; source: string; key?: string; severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'auto_resolved' | 'manual_resolved' | 'ignored';
  summary?: string; metric?: string; threshold?: number; value?: number; recommended_action?: string;
  first_seen_at: string; last_seen_at: string; resolved_at?: string | null; resolved_by?: string | null;
  observation_count?: number;
}
interface HealActionDto {
  _id: string; incident_id?: string | null; action: string; status: 'success' | 'failed' | 'skipped' | 'info';
  detail?: string; triggered_by?: string; created_at: string;
}
interface MetricsDto { minutes: number; bucket_size_seconds: number; buckets: { t: string; errors: number; events: number }[]; }

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtShort(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function severityBadge(s: IncidentDto['severity']) {
  const cls = s === 'critical' ? 'badge-danger' : s === 'warning' ? 'badge-warning' : 'badge-free';
  const label = s === 'critical' ? 'Critique' : s === 'warning' ? 'Attention' : 'Info';
  return <span className={`badge text-[10px] ${cls}`}>{label}</span>;
}

function statusBadge(s: IncidentDto['status']) {
  if (s === 'open') return <span className="badge text-[10px] badge-danger">Ouvert</span>;
  if (s === 'auto_resolved') return <span className="badge text-[10px] badge-success">Auto-résolu</span>;
  if (s === 'manual_resolved') return <span className="badge text-[10px] badge-success">Clôturé</span>;
  return <span className="badge text-[10px] badge-free">Ignoré</span>;
}

function actionStatusIcon(s: HealActionDto['status']) {
  if (s === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  if (s === 'failed') return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  if (s === 'skipped') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  return <Activity className="w-4 h-4 text-gray-400 flex-shrink-0" />;
}

function MetricCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Activity; label: string; value: number | string; sub?: string; tone?: 'danger' | 'warn' | 'ok' | 'neutral';
}) {
  const valueCls =
    tone === 'danger' ? 'text-red-600 dark:text-red-400'
      : tone === 'warn' ? 'text-amber-600 dark:text-amber-400'
        : tone === 'ok' ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-gray-900 dark:text-white';
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-extrabold mt-0.5 ${valueCls}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniChart({ data }: { data: MetricsDto | null }) {
  if (!data || data.buckets.length < 2) return null;
  const maxE = Math.max(1, ...data.buckets.map(b => b.errors));
  const maxEv = Math.max(1, ...data.buckets.map(b => b.events));
  const w = 720;
  const h = 140;
  const step = w / Math.max(1, data.buckets.length - 1);
  const errPoints = data.buckets.map((b, i) => `${(i * step).toFixed(1)},${(h - (b.errors / maxE) * (h - 16) - 8).toFixed(1)}`).join(' ');
  const evPoints = data.buckets.map((b, i) => `${(i * step).toFixed(1)},${(h - (b.events / maxEv) * (h - 16) - 8).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="none">
      <line x1="0" y1={h - 8} x2={w} y2={h - 8} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" />
      <polyline points={errPoints} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />
      <polyline points={evPoints} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />
      <circle cx={w} cy={Number(errPoints.split(' ').pop()?.split(',')[1] ?? 0)} r="3" fill="#ef4444" />
    </svg>
  );
}

export default function MonitoringPanel() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<OverviewDto | null>(null);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [errors, setErrors] = useState<ErrorDto[]>([]);
  const [incidents, setIncidents] = useState<IncidentDto[]>([]);
  const [healLog, setHealLog] = useState<HealActionDto[]>([]);
  const [metrics, setMetrics] = useState<MetricsDto | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!token || !mounted.current) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [ov, ev, er, inc, heal, met] = await Promise.all([
        fetch(`${API_BASE}/admin/monitoring/overview`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/admin/monitoring/events?limit=40`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/admin/monitoring/errors?limit=40`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/admin/monitoring/incidents?limit=30`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/admin/monitoring/self-heal?limit=30`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/admin/monitoring/metrics?minutes=60`, { headers }).then(r => r.json()),
      ]);
      if (!mounted.current) return;
      if (ov && !(ov as Record<string, unknown>).error) setOverview(ov as OverviewDto);
      if (Array.isArray(ev)) setEvents(ev as EventDto[]);
      if (Array.isArray(er)) setErrors(er as ErrorDto[]);
      if (Array.isArray(inc)) setIncidents(inc as IncidentDto[]);
      if (Array.isArray(heal)) setHealLog(heal as HealActionDto[]);
      if (met && Array.isArray((met as MetricsDto).buckets)) setMetrics(met as MetricsDto);
      setErr('');
    } catch (e) {
      if (mounted.current) setErr(e instanceof Error ? e.message : 'Erreur de chargement');
    }
  }, [token]);

  useEffect(() => {
    void load();
    const id = setInterval(() => { if (!paused) void load(); }, 5000);
    return () => clearInterval(id);
  }, [load, paused]);

  const runSelfHeal = async () => {
    if (!token) return;
    setBusy('run'); setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/monitoring/self-heal/run`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data as Record<string, unknown>)?.error as string || 'Échec');
      setBusy(null);
      await load();
    } catch (e) { setBusy(null); setErr(e instanceof Error ? e.message : 'Erreur'); }
  };

  const resolveIncident = async (id: string) => {
    if (!token) return;
    setBusy(`resolve:${id}`); setErr('');
    try {
      const res = await fetch(`${API_BASE}/admin/monitoring/incidents/${id}/resolve`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data as Record<string, unknown>)?.error as string || 'Échec');
      setBusy(null);
      await load();
    } catch (e) { setBusy(null); setErr(e instanceof Error ? e.message : 'Erreur'); }
  };

  const worker = overview?.worker;
  const openIncidents = incidents.filter(i => i.status === 'open');
  const live = events.slice(0, 12);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="section-title flex items-center gap-2">
            <Radar className="w-5 h-5 text-indigo-500" /> Monitoring temps réel
          </h3>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${paused ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            <span className={`w-2 h-2 rounded-full ${paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            {paused ? 'En pause' : 'En direct'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaused(p => !p)} className="btn-ghost text-xs">
            <Activity className="w-4 h-4" /> {paused ? 'Reprendre' : 'Pause'}
          </button>
          <button onClick={() => void load()} className="btn-ghost text-xs" title="Actualiser">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => void runSelfHeal()} disabled={busy === 'run'} className="btn-primary text-xs">
            {busy === 'run' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Lancer l'auto-réparation
          </button>
        </div>
      </div>

      {worker && (
        <div className="card p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-indigo-500" />
            Worker : <strong className="text-gray-900 dark:text-gray-200">{worker.running ? 'actif' : 'arrêté'}</strong>
          </span>
          <span>Détection : {fmtDate(worker.last_detection)}</span>
          <span>Auto-réparation : {fmtDate(worker.last_self_heal)}</span>
          <span>Intervalle : {Math.round((worker.interval_ms || 60000) / 1000)}s</span>
        </div>
      )}

      {err && (
        <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-300">{err}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={XCircle} label="Erreurs (24h)" value={overview?.errors_24h ?? '—'} sub={`${overview?.errors_1h ?? 0} la dernière heure`} tone={overview && overview.errors_24h > 0 ? 'danger' : 'ok'} />
        <MetricCard icon={ShieldAlert} label="Incidents ouverts" value={overview?.open_incidents ?? '—'} sub={`${overview?.open_critical ?? 0} critiques`} tone={overview && overview.open_critical > 0 ? 'danger' : overview && overview.open_incidents > 0 ? 'warn' : 'ok'} />
        <MetricCard icon={Zap} label="Actions auto-réparation" value={overview?.heal_actions_24h ?? '—'} sub="sur 24h" tone="neutral" />
        <MetricCard icon={Activity} label="Connexions (24h)" value={overview?.logins_24h ?? '—'} sub={`${overview?.signups_24h ?? 0} inscriptions`} tone="neutral" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Flux d'erreurs / événements (60 min)</h4>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Erreurs</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Événements</span>
          </div>
        </div>
        <MiniChart data={metrics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Incidents
                {openIncidents.length > 0 && <span className="badge text-[10px] badge-danger">{openIncidents.length} ouverts</span>}
              </h4>
            </div>
            <div className="p-2">
              {incidents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 p-3">Aucun incident détecté.</p>}
              {incidents.slice(0, 10).map(inc => (
                <div key={inc._id} className="rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-t border-gray-50 dark:border-gray-800 first:border-t-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{inc.title}</span>
                        {severityBadge(inc.severity)}
                        {statusBadge(inc.status)}
                      </div>
                      {inc.summary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{inc.summary}</p>}
                      {inc.recommended_action && inc.status === 'open' && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5 mt-2">
                          <strong>Recommandation :</strong> {inc.recommended_action}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                        Vu {fmtShort(inc.last_seen_at)} · {inc.metric ? `${inc.metric} ${inc.value}/${inc.threshold ?? '—'}` : ''} · observations : {inc.observation_count ?? 1}
                      </p>
                    </div>
                    {inc.status === 'open' && (
                      <button
                        onClick={() => void resolveIncident(inc._id)}
                        disabled={busy === `resolve:${inc._id}`}
                        className="btn-ghost text-xs flex-shrink-0 disabled:opacity-50"
                      >
                        {busy === `resolve:${inc._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        Résoudre
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Journal d'auto-réparation
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-custom">
              {healLog.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Aucune action enregistrée.</p>}
              {healLog.map(a => (
                <div key={a._id} className="flex items-start gap-2.5 text-xs">
                  {actionStatusIcon(a.status)}
                  <div className="min-w-0">
                    <p className="text-gray-800 dark:text-gray-200">
                      <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded mr-1.5">{a.action}</span>
                      {a.detail}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {fmtShort(a.created_at)} · {a.triggered_by === 'admin' ? 'administrateur' : 'worker'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card overflow-hidden">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 px-5 pt-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Événements en direct
            </h4>
            <div className="p-2">
              {live.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 p-3">Aucun événement récent.</p>}
              {live.map(ev => (
                <div key={ev._id} className="flex items-center gap-2 px-3 py-2 border-t border-gray-50 dark:border-gray-800 first:border-t-0 text-xs">
                  <span className="badge text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono flex-shrink-0">{ev.event}</span>
                  <span className="text-gray-500 dark:text-gray-400 truncate flex-1">
                    {ev.user_id ? `user:${String(ev.user_id).slice(0, 8)}` : 'système'}
                    {ev.props && Object.keys(ev.props).length > 0 ? ` · ${JSON.stringify(ev.props).slice(0, 60)}` : ''}
                  </span>
                  <span className="text-gray-400 dark:text-gray-600 flex-shrink-0">{fmtDate(ev.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Dernières erreurs
                {overview && overview.errors_24h > 0 && <span className="badge text-[10px] badge-danger">{overview.errors_24h}</span>}
              </h4>
            </div>
            <div className="p-2">
              {errors.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 p-3">Aucune erreur enregistrée.</p>}
              {errors.slice(0, 12).map(e => (
                <div key={e._id} className="px-3 py-2 border-t border-gray-50 dark:border-gray-800 first:border-t-0">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className={`badge text-[10px] ${e.status_code && e.status_code >= 500 ? 'badge-danger' : e.status_code && e.status_code >= 400 ? 'badge-warning' : 'badge-free'}`}>
                      {e.method || ''} {e.status_code || '—'}
                    </span>
                    <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300 truncate">{e.path || '/'}</span>
                    <span className="text-gray-400 dark:text-gray-600 ml-auto flex-shrink-0">{fmtDate(e.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">{e.error_name}: {e.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
