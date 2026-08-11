import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import LoadingSpinner from './components/ui/LoadingSpinner';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';

const CvStudio = lazy(() => import('./components/CvStudio'));
const CvBuilder = lazy(() => import('./components/CvBuilder'));
const ResumeUpload = lazy(() => import('./components/ResumeUpload'));
const FeedbackViewer = lazy(() => import('./components/FeedbackViewer'));
const ClassicResumePicker = lazy(() => import('./components/ClassicResumePicker'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const PricingPanel = lazy(() => import('./components/PricingPanel'));
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const JobDashboard = lazy(() => import('./components/JobDashboard'));
const LinkedInDashboard = lazy(() => import('./components/LinkedInDashboard'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));
const LandingPage = lazy(() => import('./components/LandingPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OAuthCallbackPage() {
  const { setToken, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;
    const token = searchParams.get('token');
    const error = searchParams.get('oauth_error');
    if (token) {
      localStorage.setItem('token', token);
      setToken(token);
      setHandled(true);
      navigate('/dashboard', { replace: true });
    } else if (error) {
      setHandled(true);
      navigate(`/login?oauth_error=${encodeURIComponent(error)}`, { replace: true });
    } else if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else if (!isLoading) {
      setHandled(true);
      navigate('/login', { replace: true });
    }
  }, [searchParams, setToken, navigate, isAuthenticated, isLoading, handled]);

  return <LoadingSpinner />;
}

function LoginPage({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' }) {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('oauth_error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">UtopiaHire</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">IA au service de votre candidature</p>
        </div>
        {oauthError && (
          <div className="mb-4 rounded-lg border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Connexion sociale impossible : {decodeURIComponent(oauthError)}
            </p>
          </div>
        )}
        <AuthForm onAuth={(t) => { setToken(t); navigate('/dashboard'); }} initialMode={initialMode} />
      </div>
    </div>
  );
}

function ClassicPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get('id') || null;
  const [listKey, setListKey] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
      <div className="space-y-4">
        <ClassicResumePicker
          selectedId={resumeId}
          onSelect={(id) => setSearchParams(id ? { id } : {}, { replace: true })}
          refreshKey={listKey}
          onListInvalidated={() => setListKey(k => k + 1)}
        />
        <ResumeUpload
          onUploaded={(id) => { setSearchParams({ id }, { replace: true }); setListKey(k => k + 1); }}
        />
      </div>
      <div>
        {resumeId ? (
          <FeedbackViewer
            resumeId={resumeId}
            onDeleted={() => { setSearchParams({}, { replace: true }); setListKey(k => k + 1); }}
          />
        ) : (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-1">Aucun CV sélectionné</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Choisissez un CV dans la liste ou importez-en un nouveau pour voir le contenu et lancer l'analyse.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CvProPage() {
  const location = useLocation();
  const seed = (location.state as { studioSeed?: { text: string } })?.studioSeed || null;
  return <CvStudio studioSeed={seed ? { text: seed.text, key: Date.now() } : null} onStudioSeedConsumed={() => {}} />;
}

function AdminPage() {
  const navigate = useNavigate();
  return <AdminDashboard onClose={() => navigate('/dashboard')} />;
}

function CvBuilderPage() {
  const navigate = useNavigate();
  return (
    <CvBuilder
      onOpenCvProWithText={(text) => navigate('/cvpro', { state: { studioSeed: { text } } })}
      onPublished={(id) => navigate(`/classic?id=${id}`)}
    />
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page introuvable</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={
        <Suspense fallback={<LoadingSpinner />}>
          <LandingPage />
        </Suspense>
      } />
      <Route path="/login" element={
        <Suspense fallback={<LoadingSpinner />}>
          <LoginPage />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<LoadingSpinner />}>
          <LoginPage initialMode="signup" />
        </Suspense>
      } />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/reset-password" element={
        <Suspense fallback={<LoadingSpinner />}>
          <ResetPasswordPage />
        </Suspense>
      } />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingSpinner />}><JobDashboard /></Suspense>
        } />
        <Route path="/cvpro" element={
          <Suspense fallback={<LoadingSpinner />}><CvProPage /></Suspense>
        } />
        <Route path="/cvbuilder" element={
          <Suspense fallback={<LoadingSpinner />}><CvBuilderPage /></Suspense>
        } />
        <Route path="/classic" element={
          <Suspense fallback={<LoadingSpinner />}><ClassicPage /></Suspense>
        } />
        <Route path="/pricing" element={
          <Suspense fallback={<LoadingSpinner />}><PricingPanel /></Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<LoadingSpinner />}><AdminPage /></Suspense>
        } />
        <Route path="/payment" element={
          <Suspense fallback={<LoadingSpinner />}><PaymentPage /></Suspense>
        } />
        <Route path="/search" element={
          <Suspense fallback={<LoadingSpinner />}><JobDashboard /></Suspense>
        } />
        <Route path="/linkedin" element={
          <Suspense fallback={<LoadingSpinner />}><LinkedInDashboard /></Suspense>
        } />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
