import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Rocket, FileText, Sparkles, Bot, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listResumes } from '../lib/api';
import { useLang } from '../i18n/LanguageContext';

interface Step {
  key: string;
  titleKey: string;
  descriptionKey: string;
  icon: typeof FileText;
  actionLabelKey: string;
  path: string;
}

const STEPS: Step[] = [
  { key: 'resume', titleKey: 'onboarding.resume', descriptionKey: 'onboarding.resumeDesc', icon: FileText, actionLabelKey: 'onboarding.resumeCta', path: '/cvbuilder' },
  { key: 'diagnosis', titleKey: 'onboarding.diagnosis', descriptionKey: 'onboarding.diagnosisDesc', icon: Sparkles, actionLabelKey: 'onboarding.diagnosisCta', path: '/classic' },
  { key: 'agent', titleKey: 'onboarding.agent', descriptionKey: 'onboarding.agentDesc', icon: Bot, actionLabelKey: 'onboarding.agentCta', path: '/dashboard' },
  { key: 'profile', titleKey: 'onboarding.profile', descriptionKey: 'onboarding.profileDesc', icon: UserIcon, actionLabelKey: 'onboarding.profileCta', path: '/dashboard' },
];

function readChecklist(): string[] {
  try { return JSON.parse(localStorage.getItem('onboarding_checklist') || '[]'); } catch { return []; }
}

function writeChecklist(keys: string[]) {
  try { localStorage.setItem('onboarding_checklist', JSON.stringify(keys)); } catch { /* ignore */ }
}

export default function OnboardingChecklist() {
  const { t } = useLang();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState<string[]>(() => readChecklist());
  const [hasResume, setHasResume] = useState(false);
  const [hidden, setHidden] = useState(false);

  const refreshResumeStatus = useCallback(async () => {
    if (!token) return;
    const res = await listResumes(token);
    if (!('error' in res) && res.length > 0) setHasResume(true);
  }, [token]);

  useEffect(() => { refreshResumeStatus(); }, [refreshResumeStatus]);

  // A CV exists: the two CV steps are auto-complete.
  useEffect(() => {
    if (!hasResume) return;
    setDone(prev => {
      const next = [...new Set([...prev, 'resume', 'diagnosis'])];
      writeChecklist(next);
      return next;
    });
  }, [hasResume]);

  const toggle = (key: string) => {
    setDone(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      writeChecklist(next);
      return next;
    });
  };

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem('onboarding_dismissed', '1'); } catch { /* ignore */ }
  };

  useEffect(() => {
    try {
      if (localStorage.getItem('onboarding_dismissed') === '1') setHidden(true);
    } catch { /* ignore */ }
  }, []);

  if (hidden) return null;

  const allStepsDone = STEPS.every(s => done.includes(s.key));
  if (allStepsDone) return null;

  const completedCount = done.length;

  return (
    <div className="card p-6 mb-6 relative overflow-hidden">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
          <Rocket className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('onboarding.title')}</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('onboarding.subtitle')} <span className="font-semibold text-indigo-600 dark:text-indigo-400">{completedCount}/{STEPS.length}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {STEPS.map(step => {
          const Icon = step.icon;
          const isDone = done.includes(step.key);
          const isResumeDependent = step.key === 'diagnosis';
          const isLocked = isResumeDependent && !hasResume && !done.includes('resume');
          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                isDone
                  ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50'
              }`}
            >
              <button
                onClick={() => toggle(step.key)}
                className="mt-0.5 flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors"
                aria-label={`${isDone ? 'Décocher' : 'Cocher'} ${t(step.titleKey)}`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isDone ? 'text-emerald-500' : 'text-indigo-500'}`} />
                  <p className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-200'}`}>
                    {t(step.titleKey)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t(step.descriptionKey)}</p>
                {!isDone && (
                  <button
                    onClick={() => {
                      if (isLocked) return;
                      if (step.key === 'agent' || step.key === 'profile') {
                        toggle(step.key);
                        return;
                      }
                      navigate(step.path);
                    }}
                    disabled={isLocked}
                    className={`mt-2 text-xs font-semibold ${
                      isLocked
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
                    }`}
                  >
                    {isLocked ? t('onboarding.locked') : t(step.actionLabelKey)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
