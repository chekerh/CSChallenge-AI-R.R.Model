# Next steps (recommended order)

## Immediate (product + QA)

1. **Manual journey:** Signup → Créer mon CV → Publier → confirm classic opens correct CV → Télécharger → Traiter avec l’IA → verify feedback.
2. **Pro demo:** Set `plan: 'pro'` on a test user in Mongo; confirm CV Pro job match + rewrite enabled and account bar shows Pro.
3. **Pricing page** (static first): link from header or user bar — even a single MDX/React page with TND-aligned copy (see `cv-tool-tunisia-workspace/PRICING_AND_VALUE.md`).

## Short term (engineering)

1. **Vitest** for `frontend/src/lib/api.ts` helpers (`listResumes`, `fetchMe`) with mocked `fetch`.
2. **Supertest** integration tests for `GET /resumes` + ownership (if not already covered).
3. **README** split: one Mongo path, archive Postgres/Bolt notes to `docs/archive/` (per delivery-workspace next steps).

## Medium term (monetization)

1. Stripe (or local provider) webhook → set `User.plan`.
2. Feature flags per route (already partially expressed via `plan`).

## Cross-reference

- Deep CV product backlog: `cv-tool-tunisia-workspace/NEXT_STEPS.md`
- Security/deploy: `delivery-workspace/DEPLOYMENT_CHECKLIST.md`, `SECURITY_REVIEW.md`
- Architecture: `project-architecture/ARCHITECTURE.md`, `API_MAP.md`
