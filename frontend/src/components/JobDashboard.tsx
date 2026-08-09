import { useState, useEffect } from 'react';
import {
  Briefcase, CheckCircle,
  TrendingUp, Target, Zap, Plus, Play,
  ChevronRight, BarChart3, Bell, Bot, Trash2, RefreshCw,
  X, Loader2, Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchAgents, fetchApplications, fetchJobStats,
  createAgent, updateAgent, deleteAgent, runAgent,
  createApplication, updateApplication,
  type JobAgentDto, type JobApplicationDto, type JobStatsDto,
} from '../lib/jobApi';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  saved: { label: 'Sauvegardé', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  applied: { label: 'Postulé', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  interview: { label: 'Entretien', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  accepted: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' },
};

export default function JobDashboard() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'applications' | 'analytics'>('overview');
  const [agents, setAgents] = useState<JobAgentDto[]>([]);
  const [applications, setApplications] = useState<JobApplicationDto[]>([]);
  const [, setStats] = useState<JobStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', keywords: '', location: '', schedule: 'daily' });
  const [newApp, setNewApp] = useState({ company: '', position: '', url: '', notes: '' });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true); setError('');
    Promise.all([
      fetchAgents(token).catch(() => ({ error: 'Failed' })),
      fetchApplications(token).catch(() => ({ error: 'Failed' })),
      fetchJobStats(token).catch(() => ({ error: 'Failed' })),
    ]).then(([a, ap, s]) => {
      setLoading(false);
      if (!('error' in a)) setAgents(a.data);
      if (!('error' in ap)) setApplications(ap.data);
      if (!('error' in s)) setStats(s.data);
      if ('error' in a && 'error' in ap) setError('Erreur de chargement');
    });
  }, [token]);

  async function handleCreateAgent() {
    if (!token || !newAgent.name.trim()) return;
    setBusy('create-agent');
    const r = await createAgent(token, {
      name: newAgent.name,
      keywords: newAgent.keywords.split(',').map(s => s.trim()).filter(Boolean),
      location: newAgent.location,
      schedule: newAgent.schedule,
    });
    setBusy(null);
    if (!('error' in r)) {
      setAgents(prev => [r.data, ...prev]);
      setShowCreateAgent(false);
      setNewAgent({ name: '', keywords: '', location: '', schedule: 'daily' });
    }
  }

  async function handleDeleteAgent(id: string) {
    if (!token) return;
    const confirmDelete = window.confirm('Voulez-vous vraiment supprimer cet agent de recherche d’emploi ?');
    if (!confirmDelete) return;
    const r = await deleteAgent(token, id);
    if (!('error' in r)) setAgents(prev => prev.filter(a => a._id !== id));
  }

  async function handleToggleAgent(agent: JobAgentDto) {
    if (!token) return;
    const r = await updateAgent(token, agent._id, { enabled: !agent.enabled });
    if (!('error' in r)) setAgents(prev => prev.map(a => a._id === agent._id ? r.data : a));
  }

  async function handleRunAgent(id: string) {
    if (!token) return;
    setBusy(`run-${id}`);
    const r = await runAgent(token, id);
    setBusy(null);
    if (!('error' in r)) {
      setAgents(prev => prev.map(a => a._id === id ? { ...a, status: 'running', last_run: new Date().toISOString() } : a));
      setTimeout(() => {
        setAgents(prev => prev.map(a => a._id === id ? { ...a, status: 'idle' } : a));
      }, 2000);
    }
  }

  async function handleCreateApp() {
    if (!token || !newApp.company.trim() || !newApp.position.trim()) return;
    setBusy('create-app');
    const r = await createApplication(token, { company: newApp.company, position: newApp.position, url: newApp.url, notes: newApp.notes });
    setBusy(null);
    if (!('error' in r)) {
      setApplications(prev => [r.data, ...prev]);
      setShowCreateApp(false);
      setNewApp({ company: '', position: '', url: '', notes: '' });
    }
  }

  async function handleUpdateAppStatus(id: string, status: string) {
    if (!token) return;
    const r = await updateApplication(token, id, { status: status as JobApplicationDto['status'] });
    if (!('error' in r)) setApplications(prev => prev.map(a => a._id === id ? r.data : a));
  }

  const activeAgentsCount = agents.filter(a => a.enabled).length;
  const interviews = applications.filter(a => a.status === 'interview').length;
  const avgScore = applications.length > 0
    ? Math.round(applications.reduce((s, a) => s + (a.match_score || 0), 0) / applications.length)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
    </div>
  );

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Tableau de bord</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Gérez votre recherche d'emploi automatisée.</p>
      </div>

      {error && (
        <div className="card p-4 border-red-200 bg-red-50 text-sm text-red-800">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Agents actifs', value: `${activeAgentsCount}/${agents.length}`, icon: Bot, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Candidatures', value: applications.length.toString(), icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Entretiens', value: interviews.toString(), icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Score moyen', value: `${avgScore}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card card-hover p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`p-2 rounded-lg w-fit mb-3 ${stat.bg} dark:opacity-90`}><Icon className={`w-4 h-4 ${stat.color}`} /></div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {[
          { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
          { id: 'agents' as const, label: 'Agents', icon: Bot },
          { id: 'applications' as const, label: 'Candidatures', icon: Briefcase },
          { id: 'analytics' as const, label: 'Analytiques', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Activité récente</h2>
              <button onClick={() => setActiveTab('applications')} className="btn-ghost text-xs">Voir tout <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-3">
                  {applications.slice(0, 3).map((app, i) => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
                    return (
                      <div key={app._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{app.position}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.company}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
              {applications.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Aucune candidature</p>}
            </div>
          </div>
          <div className="card p-5 animate-fade-in">
            <h2 className="section-title mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <button onClick={() => setShowCreateAgent(true)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all">
                <Plus className="w-5 h-5" /><span className="text-sm font-medium">Créer un agent de recherche</span>
              </button>
              <button onClick={() => setShowCreateApp(true)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-500 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-all">
                <Briefcase className="w-5 h-5" /><span className="text-sm font-medium">Ajouter une candidature</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Agents de recherche</h2>
            <button onClick={() => setShowCreateAgent(true)} className="btn-primary"><Plus className="w-4 h-4" />Nouvel agent</button>
          </div>

          {showCreateAgent && (
            <div className="card p-5 border-indigo-200/50 dark:border-indigo-800/50 bg-indigo-50/30 dark:bg-indigo-900/20 animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Nouvel agent</h3>
                <button onClick={() => setShowCreateAgent(false)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom de l'agent</label>
                  <input className="input-field" value={newAgent.name} onChange={e => setNewAgent(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Dev frontend" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lieu</label>
                  <input className="input-field" value={newAgent.location} onChange={e => setNewAgent(p => ({ ...p, location: e.target.value }))} placeholder="Ex: Tunis, Remote" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mots-clés (virgules)</label>
                  <input className="input-field" value={newAgent.keywords} onChange={e => setNewAgent(p => ({ ...p, keywords: e.target.value }))} placeholder="React, TypeScript" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fréquence</label>
                  <select className="select-field" value={newAgent.schedule} onChange={e => setNewAgent(p => ({ ...p, schedule: e.target.value }))}>
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateAgent(false)} className="btn-secondary">Annuler</button>
                <button onClick={handleCreateAgent} disabled={busy === 'create-agent' || !newAgent.name.trim()} className="btn-primary">
                  {busy === 'create-agent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Créer
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {agents.map((agent, i) => (
              <div key={agent._id} className="card p-4 animate-scale-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 ${agent.enabled ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{agent.name}</h3>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          agent.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          agent.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                          agent.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {agent.status === 'running' ? 'En cours' : agent.status === 'error' ? 'Erreur' : agent.enabled ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{agent.schedule === 'daily' ? 'Quotidien' : 'Hebdomadaire'}</span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{agent.keywords?.join(', ') || 'Aucun mot-clé'}</span>
                      </div>
                      {agent.last_run && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Dernière exécution : {new Date(agent.last_run).toLocaleString()}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleAgent(agent)} className="btn-ghost p-2" title={agent.enabled ? 'Désactiver' : 'Activer'}>
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRunAgent(agent._id)} disabled={busy === `run-${agent._id}`} className="btn-ghost p-2" title="Lancer">
                      {busy === `run-${agent._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDeleteAgent(agent._id)} className="btn-ghost p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {agents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Aucun agent. Créez-en un pour automatiser votre recherche.</p>}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Mes candidatures</h2>
            <button onClick={() => setShowCreateApp(true)} className="btn-primary"><Plus className="w-4 h-4" />Nouvelle</button>
          </div>

          {showCreateApp && (
            <div className="card p-5 border-violet-200/50 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-900/20 animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Nouvelle candidature</h3>
                <button onClick={() => setShowCreateApp(false)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Entreprise *</label><input className="input-field" value={newApp.company} onChange={e => setNewApp(p => ({ ...p, company: e.target.value }))} placeholder="Nom" /></div>
                <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Poste *</label><input className="input-field" value={newApp.position} onChange={e => setNewApp(p => ({ ...p, position: e.target.value }))} placeholder="Intitulé" /></div>
                <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lien</label><input className="input-field" value={newApp.url} onChange={e => setNewApp(p => ({ ...p, url: e.target.value }))} placeholder="URL de l'offre" /></div>
                <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label><input className="input-field" value={newApp.notes} onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))} placeholder="Infos" /></div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateApp(false)} className="btn-secondary">Annuler</button>
                <button onClick={handleCreateApp} disabled={busy === 'create-app' || !newApp.company.trim() || !newApp.position.trim()} className="btn-primary">
                  {busy === 'create-app' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Ajouter
                </button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left font-medium text-gray-500 dark:text-gray-400 p-4 pl-5">Poste</th>
                    <th className="text-left font-medium text-gray-500 dark:text-gray-400 p-4">Entreprise</th>
                    <th className="text-left font-medium text-gray-500 dark:text-gray-400 p-4">Statut</th>
                    <th className="text-left font-medium text-gray-500 dark:text-gray-400 p-4 hidden sm:table-cell">Score</th>
                    <th className="text-left font-medium text-gray-500 dark:text-gray-400 p-4 hidden md:table-cell">Date</th>
                    <th className="text-right font-medium text-gray-500 dark:text-gray-400 p-4 pr-5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, i) => {
                    return (
                      <tr key={app._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                        <td className="p-4 pl-5 font-medium text-gray-900 dark:text-gray-100">{app.position}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{app.company}</td>
                        <td className="p-4">
                          <select className="text-[10px] rounded-full border-0 font-medium bg-transparent cursor-pointer" value={app.status} onChange={e => handleUpdateAppStatus(app._id, e.target.value)}>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div className={`h-full rounded-full ${(app.match_score || 0) >= 80 ? 'bg-emerald-500' : (app.match_score || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${app.match_score || 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{app.match_score || '—'}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400 hidden md:table-cell text-xs">{app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '—'}</td>
                        <td className="p-4 pr-5 text-right">
                          <button onClick={() => handleUpdateAppStatus(app._id, app.status === 'saved' ? 'applied' : app.status === 'applied' ? 'interview' : app.status === 'interview' ? 'accepted' : 'saved')}
                            className="btn-ghost text-xs">
                            {app.status === 'saved' ? 'Postuler' : app.status === 'applied' ? 'Entretien' : app.status === 'interview' ? 'Accepter' : '→'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {applications.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">Aucune candidature</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="card p-5">
            <h2 className="section-title mb-4">Statistiques</h2>
            <div className="space-y-3">
              {[
                { label: 'Total postulées', value: applications.filter(a => a.status !== 'saved').length, color: 'bg-blue-500' },
                { label: 'En attente', value: applications.filter(a => a.status === 'applied').length, color: 'bg-amber-500' },
                { label: 'Entretiens', value: interviews, color: 'bg-emerald-500' },
                { label: 'Refusées', value: applications.filter(a => a.status === 'rejected').length, color: 'bg-red-500' },
                { label: 'Acceptées', value: applications.filter(a => a.status === 'accepted').length, color: 'bg-indigo-500' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stat.color} dark:opacity-80`} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="section-title mb-4">Conseils</h2>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 mt-0.5"><Target className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Améliorez votre scoring</p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">Utilisez CV Pro pour optimiser votre CV et augmenter votre taux de matching.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 mt-0.5"><Bell className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Suivez vos candidatures</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Mettez à jour le statut de vos candidatures pour un meilleur suivi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 card p-5">
            <h2 className="section-title mb-3">Agents</h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{agent.keywords?.length || 0} mots-clés</span>
                    <span>·</span>
                    <span>{agent.last_run ? new Date(agent.last_run).toLocaleDateString() : 'Jamais exécuté'}</span>
                  </div>
                </div>
              ))}
              {agents.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Aucun agent configuré</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
