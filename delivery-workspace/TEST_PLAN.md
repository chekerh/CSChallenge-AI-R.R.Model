# Test plan

## Automated (current)

| Suite | Command | Scope |
|-------|---------|--------|
| Server unit | `cd server && npm test` | `getJwtSecret()` behavior (`src/config/env.test.ts`) |
| Server typecheck | `cd server && npm run lint` | Full `tsc --noEmit` |
| Frontend lint | `cd frontend && npm run lint` | ESLint |
| Frontend tests | `cd frontend && npm test` | Vitest, **no spec files yet** (passes with `--passWithNoTests`) |
| Monorepo | `npm run build && npm test && npm run lint` | From root |
| Frontend types | `npm run typecheck` | From root (runs frontend `tsc --noEmit`) |

## Integration / smoke

| Scenario | Steps | Expected |
|----------|-------|----------|
| Auth + create + process | `cd server && npm run smoke` | Signup, login, `POST /resumes/create`, `POST /resumes/versions/:versionId/process` returns ok (needs `OPENAI_API_KEY`) |
| Health | `curl http://127.0.0.1:4000/health` | `200` + `"db":"up"` when Mongo connected |

## Manual QA — auth

| ID | Scenario | Expected |
|----|----------|----------|
| A1 | Signup new email | 200 + token; user in DB |
| A2 | Signup duplicate email | 409 `email already registered` |
| A3 | Login wrong password | 401 |
| A4 | `/auth/me` without token | 401 |
| A5 | `/auth/me` with token | 200 + email |

## Manual QA — resumes

| ID | Scenario | Expected |
|----|----------|----------|
| R1 | Upload PDF with Bearer token | `resumeId` + `versionId` |
| R2 | Upload >10MB | 400 file too large |
| R3 | List `GET /resumes` | Only current user’s resumes |
| R4 | `GET /resumes/:id/versions` other user’s id | 404 |
| R5 | Process version (own) | New `improved` version + AI feedback |
| R6 | Process version (other user’s versionId) | 404 |
| R7 | Frontend upload + viewer | Feedback/version text visible after processing |

## Edge cases / failures

| Case | Expected behavior |
|------|-------------------|
| Missing `OPENAI_API_KEY` | Process/tailor returns 503 “AI service not configured” |
| Invalid Mongo id in URL | 400 `invalid id` where applicable |
| Expired JWT | 401 invalid token |
| Kaggle without env | 503 on `/kaggle/datasets` |

## Role-based access

- **Single role** today: authenticated user. All resume operations scoped by `user_id` on `Resume` documents.

## Performance / security checks (manual)

- Rate limit: burst login attempts from one IP → 429 after threshold (**inferred** threshold: 30/15min per IP in production for `/auth`).
- CORS: from disallowed origin, browser blocks (**needs browser verification**).

## Suggested future automation

- Playwright: signup → upload sample `.txt` → assert viewer shows content.
- Supertest: resume ownership middleware unit tests with in-memory Mongo (e.g. `mongodb-memory-server`).
