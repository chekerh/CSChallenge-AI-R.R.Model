# Implementation plan (phased)

## Phase 1 — Documentation-first (now)

- Complete `/product-workspace` (this folder) and ensure internal consistency:
  - plans, entitlements, admin model, dynamic content model, APIs

## Phase 2 — Production foundations

### 2.1 Admin + RBAC + audit logs
- Add `role` to `User`
- Add admin routes + admin UI pages
- AuditLog collection + middleware

### 2.2 Entitlements + quotas
- `Plan`, `Subscription`, `UsageCounter` models
- Enforcement middleware for `/cv/*` and AI endpoints

### 2.3 Dynamic content/settings
- `ContentBlock`, `AdminSetting` models + admin UI editors
- Pricing and landing copy sourced from published content blocks

## Phase 3 — Monetization

- Stripe integration:
  - checkout session create
  - webhook ingestion
  - billing portal link
- UI:
  - Pricing page (dynamic)
  - Upgrade prompts and billing settings

## Phase 4 — Retention workflow

- Job tracker module (jobs + attachments)
- Cover letter drafts + tailored exports
- “progress delta” between CV versions

## Phase 5 — Quality + hardening

- E2E test suite (Playwright)
- Monitoring/logging improvements
- Security review: admin MFA, webhook signature validation, upload hardening
- Deployment pipeline + rollback plan

## Risks and mitigations

- AI reliability: store results + retries; avoid blocking requests (queue later)
- Billing correctness: treat webhooks as source of truth; idempotent handlers
- Data privacy: redact logs, minimize event payloads

