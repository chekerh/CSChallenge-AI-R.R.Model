import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Linkedin, Send, Sparkles, Trash2,
  Loader2, Plus,
  RefreshCw, MessageSquare, CheckCircle2, AlertCircle, ShieldCheck, Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Modal from './ui/Modal';
import Tabs from './ui/Tabs';
import {
  fetchLinkedInStatus, fetchLinkedInPosts, fetchLinkedInComments, fetchLinkedInPillars,
  getLinkedInAuthUrl, updateLinkedInSettings, disconnectLinkedIn,
  createLinkedInPost, generateLinkedInDrafts, deleteLinkedInPost, publishLinkedInPost,
  generateCommentReply, sendCommentReply, dismissComment,
  type LinkedInStatusDto, type LinkedInPostDto, type LinkedInCommentDto,
  type LinkedInPillarDto, type LinkedInDraftDto, type LinkedInTone,
} from '../lib/linkedinApi';

const TONE_LABELS: Record<LinkedInTone, string> = {
  balanced: 'Équilibré',
  diagnostic: 'Diagnostic',
  story: 'Récit',
  'anti-hype': 'Anti-esbroufe',
};

const POST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  published: { label: 'Publié', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' },
  failed: { label: 'Échec', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  canceled: { label: 'Annulé', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

const REPLY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  approved: { label: 'À relire', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  sent: { label: 'Envoyé', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' },
  dismissed: { label: 'Ignoré', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

export default function LinkedInDashboard() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState<LinkedInStatusDto | null>(null);
  const [posts, setPosts] = useState<LinkedInPostDto[]>([]);
  const [comments, setComments] = useState<LinkedInCommentDto[]>([]);
  const [pillars, setPillars] = useState<LinkedInPillarDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  const [settings, setSettings] = useState({ auto_post: true, auto_reply: false, post_time: '0 9 * * *', tone: 'balanced' as LinkedInTone });
  const [composer, setComposer] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [drafts, setDrafts] = useState<LinkedInDraftDto[]>([]);
  const [generating, setGenerating] = useState(false);

  const connectedParam = searchParams.get('connected');
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true); setError('');
    Promise.all([
      fetchLinkedInStatus(token).catch(() => ({ error: 'Failed' })),
      fetchLinkedInPosts(token).catch(() => ({ error: 'Failed' })),
      fetchLinkedInComments(token).catch(() => ({ error: 'Failed' })),
      fetchLinkedInPillars(token).catch(() => ({ error: 'Failed' })),
    ]).then(([s, p, c, pl]) => {
      if (cancelled) return;
      setLoading(false);
      if ('data' in s) {
        setStatus(s.data);
        setSettings({ auto_post: s.data.auto_post, auto_reply: s.data.auto_reply, post_time: s.data.post_time, tone: s.data.tone });
      } else setError((s as { error: string }).error);
      if ('data' in p) setPosts(p.data);
      if ('data' in c) setComments(c.data);
      if ('data' in pl) setPillars(pl.data.pillars);
    });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (connectedParam === '1') {
      setNotice('Compte LinkedIn connecté avec succès.');
      setSearchParams({}, { replace: true });
    } else if (connectedParam === '0') {
      setError(oauthError || 'La connexion LinkedIn a échoué.');
      setSearchParams({}, { replace: true });
    }
  }, [connectedParam, oauthError, setSearchParams]);

  async function handleConnect() {
    if (!token) return;
    setBusy('connect');
    const r = await getLinkedInAuthUrl(token);
    setBusy(null);
    if (!('data' in r)) {
      setError(r.error === 'LinkedIn not configured on the server'
        ? 'LinkedIn n\'est pas configuré sur le serveur.'
        : r.error);
      return;
    }
    window.location.href = r.data.url;
  }

  async function handleDisconnect() {
    if (!token) return;
    if (!window.confirm('Voulez-vous vraiment déconnecter votre compte LinkedIn ?')) return;
    setBusy('disconnect');
    const r = await disconnectLinkedIn(token);
    setBusy(null);
    if ('data' in r) {
      setStatus(null);
      setPosts([]);
      setComments([]);
      setNotice('Compte LinkedIn déconnecté.');
    } else {
      setError(r.error);
    }
  }

  async function handleSaveSettings() {
    if (!token || !status?.connected) return;
    setBusy('settings');
    const r = await updateLinkedInSettings(token, {
      auto_post: settings.auto_post,
      auto_reply: settings.auto_reply,
      post_time: settings.post_time,
      tone: settings.tone,
    });
    setBusy(null);
    if (!('data' in r)) {
      setError(r.error);
    } else {
      setNotice('Paramètres enregistrés.');
      if (status) setStatus({ ...status, auto_post: settings.auto_post, auto_reply: settings.auto_reply, post_time: settings.post_time, tone: settings.tone });
    }
  }

  async function handleSaveComposer() {
    if (!token || !composer.trim()) return;
    setBusy('composer');
    const r = await createLinkedInPost(token, { text: composer });
    setBusy(null);
    if (!('data' in r)) {
      setError(r.error);
    } else {
      setPosts(prev => [r.data, ...prev]);
      setComposer('');
      setNotice('Brouillon enregistré.');
    }
  }

  async function handleGenerate() {
    if (!token) return;
    setGenerateOpen(true);
    setGenerating(true);
    setDrafts([]);
    const r = await generateLinkedInDrafts(token, 3);
    setGenerating(false);
    if (!('data' in r)) {
      setDrafts([]);
      setError(r.error);
    } else {
      setDrafts(r.data.drafts);
    }
  }

  function handleUseDraft(text: string) {
    setComposer(text);
    setGenerateOpen(false);
  }

  async function handlePublish(id: string) {
    if (!token) return;
    setBusy(`publish-${id}`);
    const r = await publishLinkedInPost(token, id);
    setBusy(null);
    if (!('data' in r)) {
      setError(r.error);
      if (r.error.includes('not connected')) {
        const s = await fetchLinkedInStatus(token);
        if ('data' in s) setStatus(s.data);
      }
    } else {
      setPosts(prev => prev.map(p => p._id === id ? r.data : p));
      setNotice('Post publié sur LinkedIn.');
      const s = await fetchLinkedInStatus(token);
      if ('data' in s) setStatus(s.data);
    }
  }

  async function handleDeletePost(id: string) {
    if (!token) return;
    if (!window.confirm('Supprimer ce post ?')) return;
    const r = await deleteLinkedInPost(token, id);
    if ('data' in r) setPosts(prev => prev.filter(p => p._id !== id));
  }

  async function handleGenerateReply(id: string) {
    if (!token) return;
    setBusy(`reply-gen-${id}`);
    const r = await generateCommentReply(token, id);
    setBusy(null);
    if (!('data' in r)) {
      setError(r.error);
    } else {
      setComments(prev => prev.map(c => c._id === id ? r.data : c));
    }
  }

  async function handleSendReply(comment: LinkedInCommentDto) {
    if (!token) return;
    const text = comment.reply_text?.trim();
    if (!text) return;
    setBusy(`reply-send-${comment._id}`);
    const r = await sendCommentReply(token, comment._id, text);
    setBusy(null);
    if (!('data' in r)) {
      setError(r.error);
    } else {
      setComments(prev => prev.map(c => c._id === comment._id ? r.data : c));
      setNotice('Réponse envoyée.');
    }
  }

  function handleEditReply(id: string, text: string) {
    setComments(prev => prev.map(c => c._id === id ? { ...c, reply_text: text } : c));
  }

  async function handleDismiss(id: string) {
    if (!token) return;
    const r = await dismissComment(token, id);
    if ('data' in r) setComments(prev => prev.map(c => c._id === id ? r.data : c));
  }

  async function refresh() {
    if (!token) return;
    setLoading(true); setError('');
    const [s, p, c] = await Promise.all([
      fetchLinkedInStatus(token).catch(() => ({ error: 'Failed' })),
      fetchLinkedInPosts(token).catch(() => ({ error: 'Failed' })),
      fetchLinkedInComments(token).catch(() => ({ error: 'Failed' })),
    ]);
    setLoading(false);
    if ('data' in s) setStatus(s.data);
    if ('data' in p) setPosts(p.data);
    if ('data' in c) setComments(c.data);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  const pendingComments = comments.filter(c => c.reply_status === 'pending' || c.reply_status === 'approved');
  const publishedCount = posts.filter(p => p.status === 'published').length;

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">LinkedIn</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Publiez chaque jour et répondez aux commentaires, sans effort.
          </p>
        </div>
        {status?.connected && (
          <button onClick={refresh} className="btn-ghost p-2" title="Actualiser" aria-label="Actualiser">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {notice && (
        <div className="card p-4 border-emerald-200 bg-emerald-50 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{notice}
        </div>
      )}
      {error && (
        <div className="card p-4 border-red-200 bg-red-50 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {!status?.connected ? (
        <div className="card p-8 text-center max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 text-white mb-4">
            <Linkedin className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Connectez votre compte LinkedIn</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            L'automatisation publie un post chaque jour et propose des réponses aux commentaires de vos posts.
            Vous relisez toujours avant l'envoi.
          </p>
          <button onClick={handleConnect} disabled={busy === 'connect' || !status?.configured} className="btn-primary">
            {busy === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
            Connecter LinkedIn
          </button>
          {!status?.configured && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-4">
              L'intégration LinkedIn n'est pas configurée sur le serveur. Contactez l'administrateur.
            </p>
          )}
          {status?.redirect_uri && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">URI de redirection : {status.redirect_uri}</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Compte', value: status.name || 'Connecté', icon: ShieldCheck, color: 'text-sky-600', bg: 'bg-sky-50' },
              { label: 'Posts publiés', value: publishedCount.toString(), icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Commentaires en attente', value: pendingComments.length.toString(), icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Postes créés', value: posts.length.toString(), icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="card card-hover p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`p-2 rounded-lg w-fit mb-3 ${stat.bg} dark:opacity-90`}><Icon className={`w-4 h-4 ${stat.color}`} /></div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Paramètres d'automatisation</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleDisconnect} disabled={busy === 'disconnect'} className="btn-ghost text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Déconnecter
                </button>
                <button onClick={handleSaveSettings} disabled={busy === 'settings'} className="btn-primary">
                  {busy === 'settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Enregistrer
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Publication automatique</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Un post généré chaque jour à l'heure choisie.</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, auto_post: !s.auto_post }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${settings.auto_post ? 'bg-indigo-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}
                  role="switch"
                  aria-checked={settings.auto_post}
                  aria-label="Publication automatique"
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow" />
                </button>
              </label>
              <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Réponses automatiques</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Répondre aux commentaires sans validation manuelle.</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, auto_reply: !s.auto_reply }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${settings.auto_reply ? 'bg-indigo-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'}`}
                  role="switch"
                  aria-checked={settings.auto_reply}
                  aria-label="Réponses automatiques"
                >
                  <span className="w-5 h-5 bg-white rounded-full shadow" />
                </button>
              </label>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ton du contenu</label>
                <select className="select-field" value={settings.tone} onChange={e => setSettings(s => ({ ...s, tone: e.target.value as LinkedInTone }))}>
                  {Object.entries(TONE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Heure de publication (cron)</label>
                <input className="input-field" value={settings.post_time} onChange={e => setSettings(s => ({ ...s, post_time: e.target.value }))} placeholder="0 9 * * *" />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ex : « 0 9 * * * » = chaque jour à 9h.</p>
              </div>
            </div>
          </div>

          <Tabs
            active={activeTab}
            onChange={id => setActiveTab(id as 'posts' | 'comments')}
            tabs={[
              { id: 'posts', label: 'Posts', count: posts.length },
              { id: 'comments', label: 'Commentaires', count: pendingComments.length },
            ]}
          />

          {activeTab === 'posts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">Rédiger un post</h2>
                  <button onClick={handleGenerate} className="btn-secondary">
                    <Sparkles className="w-4 h-4" />Générer avec l'IA
                  </button>
                </div>
                <textarea
                  className="input-field w-full min-h-[140px] resize-y"
                  value={composer}
                  onChange={e => setComposer(e.target.value.slice(0, 3000))}
                  placeholder="Écrivez ici votre post, ou générez des idées avec l'IA..."
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{composer.length}/3000</span>
                  <button onClick={handleSaveComposer} disabled={busy === 'composer' || !composer.trim()} className="btn-primary">
                    {busy === 'composer' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Enregistrer le brouillon
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="section-title">Mes posts</h2>
                  {pillars.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-md">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Piliers :</span>
                      {pillars.map(p => (
                        <span key={p.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {posts.map((post, i) => {
                  const cfg = POST_STATUS_CONFIG[post.status] || POST_STATUS_CONFIG.draft;
                  return (
                    <div key={post._id} className="card p-4 animate-scale-in" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                            {post.community && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{post.community}</span>
                            )}
                            {post.post_url && (
                              <a href={post.post_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate">{post.post_url}</a>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed line-clamp-4">{post.text}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                            <span>Créé le {new Date(post.created_at).toLocaleDateString()}</span>
                            {post.published_at && <span>· Publié le {new Date(post.published_at).toLocaleDateString()}</span>}
                            {post.likes > 0 && <span>· {post.likes} réactions</span>}
                            {post.comments_count > 0 && <span>· {post.comments_count} commentaires</span>}
                          </div>
                          {post.error && <p className="text-xs text-red-500 mt-2">{post.error}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {post.status !== 'published' && (
                            <button onClick={() => handlePublish(post._id)} disabled={busy === `publish-${post._id}`} className="btn-ghost p-2" title="Publier sur LinkedIn">
                              {busy === `publish-${post._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                          )}
                          <button onClick={() => handleDeletePost(post._id)} className="btn-ghost p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {posts.length === 0 && (
                  <div className="card p-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucun post. Rédigez-en un ou utilisez l'IA.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3 animate-fade-in">
              {comments.map((comment, i) => {
                const cfg = REPLY_STATUS_CONFIG[comment.reply_status] || REPLY_STATUS_CONFIG.pending;
                const canReply = comment.reply_status === 'pending' || comment.reply_status === 'approved';
                return (
                  <div key={comment._id} className="card p-4 animate-scale-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{comment.author_name || 'Membre LinkedIn'}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(comment.received_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                        {canReply && (
                          <div className="mt-3">
                            <textarea
                              className="input-field w-full min-h-[80px] resize-y"
                              value={comment.reply_text || ''}
                              onChange={e => handleEditReply(comment._id, e.target.value)}
                              placeholder="Réponse proposée ou à rédiger..."
                            />
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleSendReply(comment)} disabled={busy === `reply-send-${comment._id}` || !comment.reply_text?.trim()} className="btn-primary">
                                  {busy === `reply-send-${comment._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                  Envoyer
                                </button>
                                <button onClick={() => handleDismiss(comment._id)} className="btn-ghost text-xs text-gray-500">Ignorer</button>
                              </div>
                              <button onClick={() => handleGenerateReply(comment._id)} disabled={busy === `reply-gen-${comment._id}`} className="btn-secondary text-xs">
                                {busy === `reply-gen-${comment._id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Générer une réponse
                              </button>
                            </div>
                          </div>
                        )}
                        {comment.reply_status === 'sent' && comment.reply_text && (
                          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap border-l-2 border-emerald-400 pl-3">
                            {comment.reply_text}
                          </p>
                        )}
                        {comment.reply_error && <p className="text-xs text-red-500 mt-2">{comment.reply_error}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <div className="card p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun commentaire pour l'instant.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Idées générées par l'IA" size="lg">
        {generating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Aucune idée générée.</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {draft.community}
                  </span>
                  {draft.concepts.slice(0, 3).map(c => (
                    <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{c}</span>
                  ))}
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed line-clamp-5">{draft.text}</p>
                <button onClick={() => handleUseDraft(draft.text)} className="btn-primary mt-3">
                  <Plus className="w-4 h-4" />Utiliser ce post
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
