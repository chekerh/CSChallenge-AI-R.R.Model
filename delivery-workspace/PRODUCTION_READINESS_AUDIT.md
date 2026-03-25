# Production readiness audit

## Confirmed facts (initial state)

| Area | Finding |
|------|---------|
| Server bootstrap | Duplicate `connect()` + `app.listen()` in `server/src/index.ts` |
| JWT | Fallback secret `devsecret` if `JWT_SECRET` unset |
| Resume API | Unauthenticated access to process, feedback, download, versions (IDOR) |
| Frontend API | Wrong id passed to process endpoint; feedback used non-existent GET |
| Tests | Frontend missing `test` script; server had no unit tests |
| Env templates | `server/.env.example` was gitignored |
| Dependencies | `helmet`, rate limiting absent |

## What was fixed

| Priority | Item | Change |
|----------|------|--------|
| Critical | Double server listen | Single `startServer()` path in `index.ts` |
| Critical | IDOR / OpenAI abuse | `requireAuth` + ownership checks on resume/version routes |
| Critical | Broken client flow | `lib/api.ts` + `ResumeUpload` + `FeedbackViewer` aligned with API |
| High | JWT in production | `getJwtSecret()` throws if weak/missing when `NODE_ENV=production` |
| High | Error leakage | Kaggle errors less verbose; OpenAI misconfig → 503 |
| High | Upload abuse | Multer 10MB limit + extension allowlist |
| Medium | Security headers / limits | `helmet`, rate limits on `/auth` and API |
| Medium | Health check | `/health` reflects Mongo connection state |
| Medium | CORS | `CORS_ORIGIN` comma list support |
| Medium | CI scripts | Root `test`, server `vitest`, server `lint`, frontend `vitest --passWithNoTests` |
| Low | DX | `.env.example` files committed; ESLint cleanup |

## What remains / needs verification

| Item | Status |
|------|--------|
| E2E (Playwright/Cypress) | Not implemented |
| `npm run smoke` with OpenAI | **Manual**: requires `OPENAI_API_KEY`, MongoDB |
| Google OAuth | Dependencies present; **not** exposed in current `auth.ts` routes |
| `@supabase/supabase-js` in frontend | **Unused** dependency (remove or integrate) |
| `edge/` functions | Not part of Express deploy; separate runtime |
| Legacy SQL migrations (`server/migrations/*.sql`) | **Historical**; app uses MongoDB/Mongoose |
| README | Still contains contradictory PostgreSQL notes — **needs consolidation** (out of scope for code pass) |
| npm audit vulnerabilities | Reported by `npm install`; run `npm audit` / upgrade chains in a controlled window |
| Log verbosity | Request logging reduced in production (path only); adjust if more audit trail needed |

## Inferred / assumptions

- Production will place the API behind a reverse proxy and use HTTPS.
- MongoDB ObjectId strings from JWT `sub`/`id` match stored `user_id` (confirmed with Mongoose casting).
