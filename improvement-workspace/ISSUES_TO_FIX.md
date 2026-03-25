# Issues consolidated (from prior QA / audits)

Sources: `full-app-qa-workspace/BUG_REPORT.md`, `full-app-qa-workspace/FINAL_CONCLUSION.md`, `continuation-workspace/CURRENT_STATE.md`, `delivery-workspace/NEXT_STEPS.md` (themes only).

## Critical

| ID | Issue | Source | Area | Feasible now |
|----|-------|--------|------|--------------|
| C1 | Classic SVG blocked mode-switch clicks | QA BUG-001 | `App.tsx` | **Already fixed** (prior session) |

## High

| ID | Issue | Source | Area | Feasible now |
|----|-------|--------|------|--------------|
| H1 | OpenAI missing → 503 (demo confusion) | QA | Config | Document only; not a code defect |
| H2 | No E2E tests | Multiple | CI | Out of scope (large); noted in remaining |

## Medium

| ID | Issue | Source | Area | Feasible now |
|----|-------|--------|------|--------------|
| M1 | Duplicate resume titles in picker | QA BUG-002 | Picker | **Already fixed** (prior session) |
| M2 | Orphan resumes (0 versions) confuse users | QA BUG-003 | API + classic UI | **Yes** — this remediation |
| M3 | Smoke script fails opaquely when `BASE` wrong | QA BUG-004 | `smokeTest.js` | **Yes** — this remediation |

## Low

| ID | Issue | Source | Area | Feasible now |
|----|-------|--------|------|--------------|
| L1 | README contradictory (Mongo vs Postgres) | Audits | Docs | Partial; large editorial — remaining |
| L2 | Classic upload copy still EN-heavy | QA matrix | UI | Optional i18n pass — remaining |
| L3 | `GET /resumes` undocumented `version_count` | API hygiene | Docs | **Yes** — `API_MAP.md` updated |

## Not treated as bugs

- **AI service not configured** — intentional when `OPENAI_API_KEY` unset (QA BUG-005).
