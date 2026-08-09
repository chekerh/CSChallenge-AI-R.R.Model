import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase, FileText, LayoutDashboard, Sparkles,
  Menu, LogOut, Shield, CreditCard, User, Search, Moon, Sun, Linkedin,
} from 'lucide-react';
import AppUserBar from './AppUserBar';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/client';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/cvpro', label: 'CV Pro', icon: Sparkles },
  { path: '/cvbuilder', label: 'Créateur de CV', icon: FileText },
  { path: '/classic', label: 'Mode classique', icon: Briefcase },
  { path: '/search', label: 'Recherche', icon: Search },
  { path: '/linkedin', label: 'LinkedIn', icon: Linkedin },
  { path: '/pricing', label: 'Tarifs', icon: CreditCard },
  { path: '/admin', label: 'Administration', icon: Shield, adminOnly: true },
];

const PAGE_LABELS: Record<string, string> = {};
for (const item of NAV_ITEMS) PAGE_LABELS[item.path] = item.label;

export default function AppLayout() {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    api<{ role?: string; name?: string; email?: string; plan?: string }>('/auth/me')
      .then(d => {
        setUserRole(d.role || null);
        setUserName(d.name || d.email || null);
        setUserPlan(d.plan || 'free');
      })
      .catch(() => {});
  }, [token]);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'support';
  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);
  const currentPath = location.pathname;
  const currentLabel = PAGE_LABELS[currentPath] || 'Tableau de bord';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transform transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 dark:text-white">UtopiaHire</span>
            <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Job Search AI</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-custom">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 ease-out group relative
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 dark:from-indigo-900/50 to-violet-100 dark:to-violet-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{userName || 'Utilisateur'}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                userPlan === 'pro' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {userPlan === 'pro' ? 'Pro' : 'Gratuit'}
              </span>
            </div>
            <button
              onClick={() => { setToken(null); localStorage.removeItem('token'); navigate('/login'); }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Déconnexion"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <LayoutDashboard className="w-4 h-4 text-indigo-500" />
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-200 font-medium">{currentLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              <AppUserBar onOpenAdmin={() => navigate('/admin')} userRole={userRole} userPlan={userPlan} />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 lg:px-6 py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            UtopiaHire — Vérifiez toujours les suggestions avant de les appliquer.
          </p>
        </footer>
      </div>
    </div>
  );
}
