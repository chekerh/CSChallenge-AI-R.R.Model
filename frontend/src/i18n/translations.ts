export type Language = 'fr' | 'en';

const en: Record<string, string> = {
  'nav.dashboard': 'Dashboard',
  'nav.cvpro': 'CV Pro',
  'nav.cvbuilder': 'CV Builder',
  'nav.classic': 'Classic mode',
  'nav.search': 'Search',
  'nav.linkedin': 'LinkedIn',
  'nav.pricing': 'Pricing',
  'nav.admin': 'Administration',
  'nav.dark': 'Dark mode',
  'nav.light': 'Light mode',
  'nav.logout': 'Log out',
  'app.tagline': 'Job Search AI',
  'app.dark': 'Dark',
  'app.light': 'Light',
  'notifications.title': 'Notifications',
  'notifications.empty': 'No notifications',
  'notifications.readAll': 'Mark all as read',
  'notifications.justNow': "just now",
  'monitoring.title': 'Monitoring',
  'monitoring.worker': 'Worker',
  'monitoring.autoHeal': "Run self-healing",
  'monitoring.refresh': 'Refresh',
  'auth.email': 'Email address',
  'auth.password': 'Password',
  'auth.login': 'Sign in',
  'auth.signup': 'Create account',
  'auth.loginTitle': 'Log in',
  'auth.signupTitle': 'Create your account',
  'auth.loading': 'Loading…',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'landing.ctaStart': 'Get started',
  'landing.ctaLogin': 'Log in',
  'landing.pricing': 'Pricing',
  'landing.howItWorks': 'How it works',
};

const fr: Record<string, string> = {
  'nav.dashboard': 'Tableau de bord',
  'nav.cvpro': 'CV Pro',
  'nav.cvbuilder': 'Créateur de CV',
  'nav.classic': 'Mode classique',
  'nav.search': 'Recherche',
  'nav.linkedin': 'LinkedIn',
  'nav.pricing': 'Tarifs',
  'nav.admin': 'Administration',
  'nav.dark': 'Mode sombre',
  'nav.light': 'Mode clair',
  'nav.logout': 'Déconnexion',
  'app.tagline': 'Job Search AI',
  'app.dark': 'Sombre',
  'app.light': 'Clair',
  'notifications.title': 'Notifications',
  'notifications.empty': 'Aucune notification',
  'notifications.readAll': 'Tout marquer lu',
  'notifications.justNow': "à l'instant",
  'monitoring.title': 'Monitoring',
  'monitoring.worker': 'Worker',
  'monitoring.autoHeal': "Lancer l'auto-réparation",
  'monitoring.refresh': 'Actualiser',
  'auth.email': 'Adresse e-mail',
  'auth.password': 'Mot de passe',
  'auth.login': 'Se connecter',
  'auth.signup': 'Créer un compte',
  'auth.loginTitle': 'Connexion',
  'auth.signupTitle': 'Créer votre compte',
  'auth.loading': 'Chargement…',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.close': 'Fermer',
  'landing.ctaStart': 'Commencer',
  'landing.ctaLogin': 'Se connecter',
  'landing.pricing': 'Tarifs',
  'landing.howItWorks': 'Comment ça marche',
};

const dictionaries: Record<Language, Record<string, string>> = { fr, en };

export function translate(lang: Language, key: string): string {
  return dictionaries[lang][key] ?? dictionaries.fr[key] ?? key;
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  const saved = localStorage.getItem('lang');
  if (saved === 'en' || saved === 'fr') return saved;
  return 'fr';
}
