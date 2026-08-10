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
| Landing page (framer-motion, FR) + route restructure | #7 | 🔵 in flight |
| Enterprise monitoring + self-healing (admin) | #7 | 🔵 in flight |
| Admin incident alerts (email via Resend) | #8 | ⬜ planned |
| In-app notification system (bell, polling) | #9 | ⬜ planned |
| E2E smoke tests (Playwright) + SEO/meta polish | #10 | ⬜ planned |
| AI cache/dedup layer + OpenAI cost guard | #11 | ⬜ planned |
| i18n EN/FR toggle | #12 | ⬜ planned |
| Onboarding flow + UX polish | #13 | ⬜ planned |
| Social auth (Google/LinkedIn OAuth) | #14 | ⬜ planned |

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
- Send email via Resend when a critical incident is opened (throttled, once per incident)
- Config via `AdminSetting` (`monitor.alert_email`, `monitor.alert_enabled`)
- `notifications`/`AlertLog` model or reuse `SelfHealAction` with `triggered_by: system`

### #9 — In-app notifications
- `Notification` model + API (list, mark read, unread count)
- Bell + dropdown in `AppLayout`, polling
- Emit on: incident opened/resolved, subscription events, job agent activity

### #10 — E2E smoke + SEO
- Playwright: landing renders, login flow, admin monitoring tab
- `index.html` meta/OG tags, favicon, JSON-LD

### #11 — AI cache/dedup
- Content-hash cache for identical `analyzeResume`/`openaiChatJson` calls (TTL)
- Retry with backoff; cap daily OpenAI spend guard via `AdminSetting`

### #12 — i18n EN/FR
- Lightweight dictionary approach; language toggle persisted; default FR

### #13 — Onboarding flow
- Guided first-run: upload CV → diagnosis → next steps checklist

### #14 — Social auth
- Google OAuth (and LinkedIn) with account linking

## Rules

- Merge only when CI is green (lint, typecheck, test, build).
- Run `npm run lint`, `npm run typecheck`, `npm run build`, `npm test` locally before each PR.
- Keep each PR focused and self-contained.
