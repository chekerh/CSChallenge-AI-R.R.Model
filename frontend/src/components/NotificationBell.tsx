import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ShieldAlert, CreditCard, Repeat, Briefcase, Info } from 'lucide-react';
import { api } from '../lib/client';
import { useLang } from '../i18n/LanguageContext';

interface NotificationDto {
  _id: string;
  type: 'incident' | 'billing' | 'subscription' | 'system' | 'job';
  title: string;
  body?: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}

const TYPE_ICON = {
  incident: ShieldAlert,
  billing: CreditCard,
  subscription: Repeat,
  job: Briefcase,
  system: Info,
};

const TYPE_COLOR = {
  incident: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  billing: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
  subscription: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20',
  job: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20',
  system: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
};

function timeAgo(iso: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.justNow');
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function NotificationBell() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        api<{ count: number }>('/notifications/unread-count'),
        api<{ notifications: NotificationDto[] }>('/notifications?limit=15'),
      ]);
      setUnread(countRes.count);
      setItems(listRes.notifications);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'POST' });
      setItems(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnread(0);
    } catch {
      /* silent */
    }
  };

  const openItem = (n: NotificationDto) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('notifications.title')}</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('notifications.readAll')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-custom">
            {items.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">{t('notifications.empty')}</p>
            )}
            {items.map(n => {
              const Icon = TYPE_ICON[n.type] || Info;
              return (
                <button
                  key={n._id}
                  onClick={() => openItem(n)}
                  className={`w-full flex gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${n.read_at ? 'opacity-60' : ''}`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${TYPE_COLOR[n.type] || TYPE_COLOR.system}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-200">{n.title}</span>
                    {n.body && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</span>}
                    <span className="block text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at, t)}</span>
                  </span>
                  {!n.read_at && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
