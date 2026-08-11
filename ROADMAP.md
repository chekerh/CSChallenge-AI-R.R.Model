# UtopiaHire — Product Roadmap

Durable plan tracked here so work can continue across sessions. Each milestone ships as its own PR (merge only when CI is green).

## Vision

AI-powered resume review, CV building, and job-search automation for Tunisian/international job seekers.

## Status

| Milestone | PR | Status |
|---|---|---|
| Infra: monorepo, CI, shared types, auth, RBAC | #1 | ✅ merged |
| Platform: CV diagnosis, builder, resume routes | #2 | ✅ merged |
| Billing: Stripe subscriptions, webhooks | #3 | ✅ merged |
| Jobs: agents, applications, tracking | #4 | ✅ merged |
| CV Premium: studio, rewrite, job match | #5 | ✅ merged |
| LinkedIn: OAuth, posts, scheduler, comments | #6 | ✅ merged |
| Landing page (framer-motion, FR) + route restructure | #7 | ✅ merged |
| Enterprise monitoring + self-healing (admin) | #7 | ✅ merged |
| Admin incident alerts (email via Resend) | #8 | ✅ merged |
| In-app notification system (bell, polling) | #9 | ✅ merged |
| E2E smoke tests (Playwright) + SEO/meta polish | #10 | ✅ merged |
| AI cache/dedup layer + OpenAI cost guard | #11 | ✅ merged |
| i18n EN/FR toggle | #12 | ✅ merged |
| Onboarding flow + UX polish | #13 | ✅ merged |
| Social auth (Google/LinkedIn OAuth) | #14 | ✅ merged |

## Active Milestone — #7: Landing + Monitoring

Landing page and enterprise monitoring/self-heal shipped together (already implemented, pending commit/PR).

### Landing page
- [x] framer-motion installed (workspace `frontend`)
- [x] `LandingPage.tsx` at `/` — hero (grid + glow orbs + parallax), stats, bento features, how-it-works, pricing (live `/public/plans`), testimonials, CTA, footer — French
- [x] App routes restructured: `/` public landing, protected app routes as pathless layout route

### Monitoring + self-healing (admin)
- [x] Models: `SystemError`, `Incident`, `SelfHealAction`
- [x] Error capture: `errorHandler` + `responseMonitor` (catches 5xx/429 even from local route catch blocks)
- [x] `auth.login_failed` events
- [x] Circuit breaker: AdminSetting-backed, OpenAI integration, open/half-open/close lifecycle
- [x] `monitoring.ts` worker: detection (error spike, repeated error, auth anomaly, OpenAI breaker) + self-heal (auto-resolve, escalate, recommend) + manual run
- [x] Admin routes `/admin/monitoring/*` (overview, events, errors, incidents, metrics, self-heal, resolve, run-now) — gated admin
- [x] `MonitoringPanel.tsx` tab in AdminDashboard (live polling, metrics, incidents, heal log)
- [x] Verified end-to-end live (detection → dedup → auto-resolve; non-admin 403)

## Upcoming Milestones

### #8 — Admin incident alerts (email)
- [x] `sendAdminAlertEmail()` via Resend (`BRAND`, `FRONTEND_URL`)
- [x] `dispatchAlerts()` dans le cycle de monitoring — envoi unique par incident critique (`alert_sent_at`)
- [x] Config `AdminSetting` : `monitor.alert_enabled`, `monitor.alert_email`
- [x] `SelfHealAction` `admin_alert_email` + skip si `RESEND_API_KEY` placeholder
- [x] Indicateur config alertes dans le MonitoringPanel

### #9 — In-app notifications
- [x] `Notification` model + API (list paginée, unread-count, read, read-all)
- [x] `createNotification` / `notifyAdmins` (best-effort)
- [x] Bell + dropdown dans `AppLayout` (badge, polling 30s, tout marquer lu)
- [x] Émission : abonnement activé (webhook Stripe), incident → critique (admins)

### #10 — E2E smoke + SEO
- Playwright: landing renders, login flow, admin monitoring tab
- `index.html` meta/OG tags, favicon, JSON-LD

### #11 — AI cache/dedup
- Content-hash cache for identical `analyzeResume`/`openaiChatJson` calls (TTL)
- Retry with backoff; cap daily OpenAI spend guard via `AdminSetting`

### #12 — i18n EN/FR
- Lightweight dictionary approach; language toggle persisted; default FR

### #13 — Onboarding flow
- [x] `OnboardingChecklist` component (steps: CV → diagnostic → agent → profil) on dashboard overview
- [x] Auto-completion CV/diagnostic depuis les données utilisateur; progression + dismiss persistés (localStorage)
- [x] Traduit FR/EN (clés ajoutées à `translations.ts`)

### #14 — Social auth
- [x] `GET /auth/oauth/providers` + `/oauth/:provider/start` + `/oauth/:provider/callback` (état signé, purpose `oauth-login`, 15m)
- [x] Google (openid/email/profile) et LinkedIn (réutilise `linkedinApi`, redirect URI surchargeable)
- [x] `findOrCreateOAuthUser` : réutilisation par `provider_id`, liaison par email, sinon création (sans mot de passe)
- [x] Boutons Google/LinkedIn dans `AuthForm` (rendus si configurés) + route `/oauth/callback` → dashboard

## Rules

- Merge only when CI is green (lint, typecheck, test, build).
- Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` locally before each PR.
- Keep each PR focused and self-contained.
