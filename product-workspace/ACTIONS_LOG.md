# Actions log — product-workspace

This log is the source of truth for product/engineering decisions and implementation milestones.

## 2026-03-25 — Kickoff: production-grade mandate

- Established **real app reality** from the repo: UtopiaHire is a **Tunisia-first paid CV optimization platform** with:
  - Classic mode (upload/paste, versions, feedback, download, delete)
  - CV Builder (structured form → publish to classic)
  - CV Pro (deep diagnosis + role targeting; Pro-only job match + rewrites)
- Ran an **automated browser walkthrough** of core journeys; fixed a crash in `AuthForm` when error payload wasn’t a string.
- Created `/product-workspace` and began documentation-first plan:
  - Product spec, pricing, entitlements, admin model, dynamic content/settings, security, test plan, deployment plan.

### Known constraints / assumptions (explicit)

- **Billing is not yet implemented** (no Stripe/Konnect/etc). Current `User.plan` exists and is used for gating, but must be made production-grade with subscriptions + webhooks.
- **AI dependency**: OpenAI calls require `OPENAI_API_KEY`. When absent, API returns 503 and UI should show clear guidance.
- **Data store**: MongoDB (Mongoose). No separate queue/worker system yet.

### Unresolved items (carry forward)

- Build a real **admin dashboard** with roles, audit logging, and dynamic content/settings control.
- Add **subscription lifecycle** + entitlements + quotas, enforced server-side.
- Add **pricing/upgrade UX** and retention workflow (job tracker + tailored exports).

## 2026-03-25 — Implementation milestone: admin + entitlements foundation

### Implemented

- Added role model evolution:
  - `User.role` with `user|support|admin|super_admin`
  - `/auth/me` now includes role
- Added RBAC middleware:
  - `requireRole(minRole)`
- Added admin backend and persistence:
  - Models: `AdminSetting`, `ContentBlock`, `AuditLog`
  - Routes: `/admin/me`, `/admin/users`, `/admin/settings`, `/admin/content`, `/admin/audit`
  - Plan management: `/admin/plans/:code` upsert
  - Usage visibility: `/admin/usage/:userId`
- Added bootstrap operations:
  - `bootstrapSuperAdmin()` via `BOOTSTRAP_SUPER_ADMIN_EMAIL`
  - `bootstrapDefaultPlans()` seeds `free` and `pro` plans
- Added entitlements and quota enforcement:
  - Models: `Plan`, `Subscription`, `UsageCounter`
  - Service: `billing/entitlements.ts`
  - Enforced on:
    - `/cv/diagnosis` (quota)
    - `/cv/rewrite-section` (feature + quota)
    - `/cv/job-match` (feature + quota)
    - `/resumes/versions/:versionId/process` (feature + quota)
    - `/resumes/:resumeId/tailor` (feature + quota)
- Added public dynamic business data routes:
  - `/public/plans`
  - `/public/content/:key`
- Added frontend admin shell and dynamic pricing view:
  - `AdminDashboard` mode in app
  - `PricingPanel` consuming `/public/plans`

### Verification

- `npm run lint` passed (frontend + server)
- `npm run build` passed (shared + frontend + server)
- `npm test` passed (server + frontend tests)

## 2026-03-25 — Implementation milestone: dynamic pricing + analytics hooks

### Implemented

- Added public dynamic routes:
  - `GET /public/plans`
  - `GET /public/content/:key`
- Added frontend `PricingPanel` consuming server-managed plans.
- Added analytics event pipeline:
  - Model: `Event`
  - Helper: `trackEvent()`
  - Instrumented key actions: signup/login, resume upload/delete/AI process, CV diagnosis/job-match/rewrite.
- Added admin analytics endpoint:
  - `GET /admin/analytics` (30-day summary + top events).
- Extended admin UI with new **Plans** and **Analytics** tabs.

## 2026-03-25 — Implementation milestone: E2E test suite (Playwright)

### Implemented

- Added Playwright E2E harness:
  - `playwright.config.ts`
  - `tests/e2e/*.spec.ts`
- Added fixed-port E2E dev runner:
  - `npm run dev:e2e` starts API on `:4020` and frontend on `:5180`
  - `npm run test:e2e` waits for health + runs Playwright
- Added core journey specs:
  - Signup
  - Classic upload (asserts real `/resumes/upload` response)
  - Admin access + analytics tab

### Verification

- `npm run test:e2e` passed.

## 2026-03-25 — Production hardening: dependency security

### Implemented

- Added Playwright tooling deps (`@playwright/test`, `wait-on`, `cross-env`) for E2E.
- Ran `npm audit fix` to remove production (`--omit=dev`) vulnerabilities without forcing breaking upgrades.

### Verification

- `npm run lint` passed.
- `npm test` passed.

## 2026-03-25 — Admin operations polish + stable E2E

### Implemented

- Upgraded admin UI from read-only to operational actions:
  - Edit settings values (`/admin/settings/:key`)
  - Edit plan payloads (`/admin/plans/:code`)
  - Edit content draft + publish content blocks (`/admin/content/:key`, `/admin/content/:key/publish`)
- Stabilized Playwright suite:
  - Forced fixed worker count (`workers: 1`) for deterministic local runs
  - Hardened classic-upload spec timing/click behavior to avoid animation-related flakiness

### Verification

- `npm run test:e2e` passed (`3 passed`).

