# Implementation progress

## Completed (this session)

- [x] Classic resume list UI bound to `GET /resumes`
- [x] Refresh list after upload / publish
- [x] Publish from CV builder switches to classic and selects new resume
- [x] Account bar: email (when returned), plan badge, logout, free-tier Pro hint
- [x] Download current version as `.txt` from classic viewer
- [x] French copy improvements in classic feedback panel
- [x] API map update for `/auth/me` + `plan`
- [x] Continuation workspace documentation set

## Completed (inherited from prior work — not re-implemented)

- CV Pro routes, Zod validation, diagnosis persistence, tier truncation, builder draft/publish
- Server security hardening, ownership checks, rate limits
- Vite alias for `@utopiahire/shared` TS sources

## In progress

- None open in codebase from this session.

## Blocked / external

- **Real billing** (Stripe/local) — no code in repo to set `plan` to `pro` automatically.
- **E2E automation** — Playwright/Cypress not added.
- **README consolidation** — still mixed legacy Postgres/Mongo text; needs editorial pass.

## Next priorities (see `NEXT_STEPS.md`)

1. Manual QA: builder publish → classic → process → download.
2. Admin or script to toggle `User.plan` for demos.
3. Optional: expose tailor / accept in classic UI if product wants parity with API.
