# Remaining issues (not fixed in this pass)

| Issue | Severity | Why not now | Next action |
|-------|----------|-------------|-------------|
| No Playwright/Cypress E2E | High (quality) | Large setup | Add 1–2 critical-path specs (auth + mode switch + list). |
| ~~README Mongo vs Postgres noise~~ | — | **Mitigated** | Stack table + archive at `docs/archive/SETUP-LEGACY-POSTGRES-NOTES.md`; duplicate Postgres block removed from main README. |
| ~~Classic upload UI still English~~ | — | **Done** | `ResumeUpload.tsx` FR + `statusTone`. |
| ~~Delete orphan resumes~~ | — | **Done** | `DELETE /resumes/:id`, viewer + picker bulk purge. |
| Billing / Pro upgrade | High (revenue) | Out of scope | Stripe + webhook → `User.plan`. |
| OpenAI key required for AI demos | Config | By design | Document in `RUN_GUIDE` / onboarding. |
| File upload edge cases (corrupt PDF) | Medium | Needs fixtures | Manual + optional integration tests. |

## Unverified

- Picker + `version_count` behavior in **Safari** with `disabled` `<option>` + controlled value (generally OK).
- Very large resume lists (performance of aggregation) — likely fine until hundreds per user.
