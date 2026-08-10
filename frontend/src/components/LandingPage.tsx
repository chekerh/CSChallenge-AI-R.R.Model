import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion, useScroll, useTransform, useInView,
  AnimatePresence, type Variants,
} from 'framer-motion';
import {
  Sparkles, ArrowRight, Check, FileText, ScanLine, Wand2,
  Linkedin, CreditCard, Shield, Menu, X, Zap, Layers, LineChart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/client';

type PlanDto = {
  code: string; name?: string; description?: string; currency?: string;
  price_monthly?: number; is_public?: boolean; features?: string[];
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

function GlowOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-32 left-1/4 w-[40rem] h-[40rem] rounded-full bg-indigo-600/25 blur-[120px]"
        animate={{ x: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-violet-600/20 blur-[120px]"
        animate={{ x: [0, -50, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-fuchsia-600/15 blur-[100px]"
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#fonctionnalites', label: 'Fonctionnalités' },
    { href: '#comment', label: 'Comment ça marche' },
    { href: '#tarifs', label: 'Tarifs' },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 lg:px-8 h-16">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">UtopiaHire</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost">
            Se connecter
          </button>
          <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')} className="btn-primary group">
            Commencer
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="px-5 py-4 space-y-1">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  {l.label}
                </a>
              ))}
              <button onClick={() => { setOpen(false); navigate('/login'); }} className="w-full mt-2 btn-secondary">
                Se connecter
              </button>
              <button onClick={() => { setOpen(false); navigate(isAuthenticated ? '/dashboard' : '/register'); }} className="w-full btn-primary">
                Commencer gratuitement
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 160]);
  const fade = useTransform(scrollY, [0, 400], [1, 0.2]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-950 text-white pt-16">
      <div className="absolute inset-0 bg-grid-dark opacity-70" />
      <GlowOrbs />
      <motion.div style={{ y: bgY }} className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-transparent to-gray-950" />

      <motion.div style={{ opacity: fade }} className="relative z-10 max-w-5xl mx-auto px-5 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 text-sm font-medium mb-8"
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Propulsé par l'IA · Génération 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl lg:text-7xl font-extrabold tracking-tight text-balance"
        >
          Votre CV réécrit par l'IA.
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Vos offres décrochées.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto text-balance"
        >
          Analyse, réécriture, lettre de motivation et candidatures optimisées.
          UtopiaHire transforme votre profil en un aimant à entretiens — en quelques clics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-base shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 hover:-translate-y-0.5 transition-all"
          >
            <Wand2 className="w-5 h-5" />
            Analyser mon CV gratuitement
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="#comment"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-base hover:bg-white/10 transition-colors"
          >
            Voir comment ça marche
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500"
        >
          {['Sans carte bancaire', 'Gratuit pour commencer', 'Données confidentielles'].map(t => (
            <span key={t} className="inline-flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> {t}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.7 }}
        className="relative z-10 mt-20 w-full max-w-5xl px-5 lg:px-8"
      >
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2 shadow-2xl shadow-indigo-950/50">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 text-xs text-gray-400">app.utopiahire.io — studio de CV</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
            {[
              { icon: ScanLine, title: 'Analyse instantanée', desc: 'Score, points forts et lacunes détectés par l\'IA en 10 secondes.' },
              { icon: Wand2, title: 'Réécriture Pro', desc: 'Bénéficiez de formulations percutantes adaptées à chaque poste.' },
              { icon: LineChart, title: 'Suivi des candidatures', desc: 'Votre pipeline d\'offres, visuel et piloté à l\'IA.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.15 }}
                className="rounded-xl bg-gray-900/80 border border-white/10 p-5 text-left"
              >
                <f.icon className="w-6 h-6 text-indigo-400 mb-3" />
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-600">
          Démo interactive — le rendu réel varie selon votre profil.
        </div>
      </motion.div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: '12k+', label: 'CV analysés' },
    { value: '94%', label: 'de satisfaction' },
    { value: '2.3x', label: 'plus d\'entretiens' },
    { value: '10s', label: 'pour une analyse' },
  ];
  return (
    <section className="relative z-10 -mt-10 max-w-6xl mx-auto px-5 lg:px-8">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-lg"
      >
        {stats.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} custom={i} className="bg-white dark:bg-gray-900 px-6 py-8 text-center">
            <div className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, desc, i, big }: {
  icon: typeof FileText; title: string; desc: string; i: number; big?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      className={`group card card-hover p-6 lg:p-8 flex flex-col ${big ? 'md:col-span-2' : ''}`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/10 to-violet-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
          En savoir plus <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </motion.div>
  );
}

function Features() {
  const features = [
    { icon: ScanLine, title: 'Analyse IA complète', desc: 'L\'intelligence artificielle décortique votre CV : structure, mots-clés, impact, cohérence. Recevez un score sur 100 et des pistes concrètes d\'amélioration.', big: true },
    { icon: Wand2, title: 'Réécriture professionnelle', desc: 'Des formulations d\'experts RH, personnalisées selon le poste visé et le secteur. Votre expérience mise en valeur, sans bluff.' },
    { icon: FileText, title: 'Lettres de motivation', desc: 'Générez des lettres qui donnent envie d\'être lues, alignées sur l\'offre et votre parcours.' },
    { icon: Linkedin, title: 'Profil LinkedIn optimisé', desc: 'Titre, section "À propos", expérience : l\'IA aligne votre profil avec votre CV pour un personal branding cohérent.' },
    { icon: Layers, title: 'Classique ou moderne', desc: 'Deux moteurs de CV : un studio créatif ou l\'éditeur classique. Choisissez selon le poste et la culture de l\'entreprise.' },
    { icon: Zap, title: 'Candidature en 1 clic', desc: 'Importez vos CV existants, laissez l\'IA les adapter, et postulez. Le suivi de candidatures s\'occupe du reste.' },
    { icon: LineChart, title: 'Suivi & feedback', desc: 'Visualisez votre pipeline, relancez intelligemment et mesurez votre progression entretien après entretien.', big: true },
  ];

  return (
    <section id="fonctionnalites" className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Fonctionnalités
        </motion.div>
        <motion.h2 variants={fadeUp} custom={1} className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white text-balance">
          Tout l'arsenal pour décrocher le poste
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Une plateforme complète qui vous accompagne de la première analyse jusqu'à la signature.
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} i={i} />
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const { ref, inView } = useScrollReveal(0.2);
  const steps = [
    { n: '01', title: 'Importez votre CV', desc: 'Déposez votre CV actuel ou créez-en un depuis zéro. L\'IA l\'analyse et calcule votre score.' },
    { n: '02', title: 'Laissez l\'IA l\'optimiser', desc: 'Réécriture, mots-clés, structure : obtenez une version percutante, prête pour le poste visé.' },
    { n: '03', title: 'Candidatez & suivez', desc: 'Postulez, gardez un œil sur vos candidatures et améliorez en continu avec le feedback.' },
  ];
  return (
    <section id="comment" className="relative bg-gray-50 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" /> Comment ça marche
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white text-balance">
            3 étapes vers l'entretien
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative card p-8"
            >
              <div className="absolute -top-5 left-8 text-6xl font-extrabold bg-gradient-to-br from-indigo-500/15 to-violet-500/15 bg-clip-text text-transparent">
                {s.n}
              </div>
              <div className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold">{i + 1}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const { ref, inView } = useScrollReveal(0.2);

  useEffect(() => {
    api<PlanDto[]>('/public/plans')
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  const ordered = [...plans].sort((a, b) => (a.code === 'free' ? -1 : b.code === 'free' ? 1 : 0));

  return (
    <section id="tarifs" className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-32">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <CreditCard className="w-3.5 h-3.5" /> Tarifs
        </div>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white text-balance">
          Un prix clair, sans surprise
        </h2>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt.
        </p>
      </div>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {ordered.map((plan, i) => {
          const pro = plan.code === 'pro';
          return (
            <motion.div
              key={plan.code}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`card p-8 flex flex-col ${pro ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-transparent relative overflow-hidden' : ''}`}
            >
              {pro && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
              )}
              {pro && (
                <div className="inline-flex items-center gap-1 w-fit px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3" /> Recommandé
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name || plan.code}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description || ''}</p>
              <div className="mt-6 mb-6">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{plan.price_monthly || 0}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{plan.currency || 'TND'}/mois</span>
              </div>
              <ul className="space-y-3 flex-1">
                {(plan.features || []).map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ${pro ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(pro ? (token ? '/pricing' : '/register') : (isAuthenticated ? '/dashboard' : '/register'))}
                className={`mt-8 w-full ${pro ? 'btn-primary' : 'btn-secondary'} group`}
              >
                {pro ? 'Passer à Pro' : 'Commencer gratuitement'}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function TestimonialSection() {
  const { ref, inView } = useScrollReveal(0.2);
  const items = [
    { name: 'Sarra B.', role: 'Data Analyst', quote: 'J\'ai postulé avec un CV réécrit par UtopiaHire : 3 entretiens en 2 semaines. L\'analyse des mots-clés a tout changé.' },
    { name: 'Mehdi K.', role: 'Ingénieur Cloud', quote: 'Le suivi des candidatures et les relances intelligentes m\'ont fait gagner un temps fou. Je recommande à 100%.' },
    { name: 'Rim J.', role: 'Cheffe de projet', quote: 'Simple, rapide, efficace. La lettre de motivation générée était bluffante de justesse.' },
  ];
  return (
    <section className="bg-gray-950 text-white border-y border-gray-800">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Témoignages
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-balance">
            Ils ont décroché l'offre
          </h2>
        </div>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-7"
            >
              <div className="flex gap-1 mb-5 text-amber-400">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <blockquote className="text-sm text-gray-300 leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (
    <section className="max-w-7xl mx-auto px-5 lg:px-8 py-24 lg:py-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 lg:px-16 py-16 lg:py-20 text-center text-white shadow-2xl shadow-indigo-600/30"
      >
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-balance max-w-2xl mx-auto">
            Prêt à décrocher le poste de vos rêves ?
          </h2>
          <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
            Rejoignez des milliers de candidats qui candidatent mieux, pas plus.
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-semibold text-base shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all group"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">UtopiaHire</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              La recherche d'emploi augmentée par l'IA, accessible à tous.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Produit</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#fonctionnalites" className="hover:text-indigo-600 dark:hover:text-indigo-400">Fonctionnalités</a></li>
              <li><a href="#comment" className="hover:text-indigo-600 dark:hover:text-indigo-400">Comment ça marche</a></li>
              <li><a href="#tarifs" className="hover:text-indigo-600 dark:hover:text-indigo-400">Tarifs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Compte</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><button onClick={() => navigate('/login')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Connexion</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-indigo-600 dark:hover:text-indigo-400">Créer un compte</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Confiance</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Données chiffrées</span></li>
              <li><span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Confidentialité garantie</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span>© {new Date().getFullYear()} UtopiaHire. Tous droits réservés.</span>
          <span>Fait avec ♥ en Tunisie</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <main>
        <Hero />
        <StatsStrip />
        <Features />
        <HowItWorks />
        <Pricing />
        <TestimonialSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
