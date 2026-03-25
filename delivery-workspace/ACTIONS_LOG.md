# Actions log (delivery)

Chronological record of inspection and changes for production readiness.

## Phase 1 — Discovery

- Inspected root `package.json` (npm workspaces: `frontend`, `server`, `shared`).
- Read `server/src/index.ts`: **confirmed** duplicate Mongo `connect()` + duplicate `app.listen()` (critical bug: two servers / double connection risk).
- Read `server/src/auth.ts`, `middleware/authMiddleware.ts`, `routes/resume.ts`, `routes/kaggle.ts`, `openai.ts`, `db.ts`, models, `migrate.ts`.
- Read `frontend/src/App.tsx`, `lib/api.ts`, `components/ResumeUpload.tsx`, `FeedbackViewer.tsx`, `AuthForm.tsx`, `api.ts`.
- **Confirmed** frontend called `POST /resumes/versions/{resumeId}/process` with **resume id** instead of **version id**; `getFeedback` called non-existent `GET /resumes/:resumeId`.
- **Confirmed** several resume routes lacked auth / ownership checks (IDOR + unauthenticated OpenAI spend).
- **Confirmed** root `npm test` failed: frontend had no `test` script.
- **Confirmed** `server/.env.example` was gitignored; README mixed PostgreSQL/Mongo notes.

## Phase 2 — Gaps (prioritized)

Documented in `PRODUCTION_READINESS_AUDIT.md`.

## Phase 3 — Implementation

- **Server `index.ts`**: Single `connect()` + single `listen()`; added `helmet`, configurable CORS, rate limits (`express-rate-limit`), JSON body limit, production `trust proxy`, `/health` returns DB readiness (`mongoose.connection.readyState`).
- **`server/src/config/env.ts`**: Central `.env` load from `server/.env`; `getJwtSecret()` enforces strong secret in production; `getCorsOrigins()`.
- **`server/src/db.ts`**: Rely on env bootstrap from `config/env`; removed fragile `../.env` path.
- **`auth.ts`**: Signup no longer upserts over existing users (409 conflict); email normalize + basic validation; JWT uses `getJwtSecret()`.
- **`authMiddleware.ts`**: Bearer parsing; uses `getJwtSecret()`.
- **`routes/resume.ts`**: `requireAuth` + ownership helpers on versions/feedbacks/process/download; multer limits (10MB) + extension filter; safer OpenAI error mapping.
- **`routes/kaggle.ts`**: `requireAuth`; 503 when credentials missing; generic error message.
- **`openai.ts`**: `OPENAI_MODEL` default `gpt-4o-mini`; throws on API error body.
- **Types**: `server/src/types/express.d.ts` (JWT user on `Express.User`), `shims.d.ts` for `node-fetch` / `pdf-parse`.
- **`server/tsconfig.json`**: `include`/`exclude` so `vitest.config.ts` and tests are not compiled into `dist`.
- **`server/package.json`**: `helmet`, `express-rate-limit`, `vitest`, `lint` script.
- **Frontend `api.ts` / `lib/api.ts`**: Unified `API_BASE` from `VITE_API_URL` or `VITE_API_BASE`; correct version-scoped API helpers; robust JSON parse on errors.
- **`ResumeUpload.tsx`**: Process uses **`versionId`** from upload response.
- **`FeedbackViewer.tsx`**: Loads `GET /resumes/:resumeId/versions` + feedbacks per version; version picker; maps AI suggestions for display.
- **`App.tsx`**: Removed dead duplicate `AuthForm` branch inside authenticated layout.
- **ESLint**: `AssistantCharacter`, `InteractiveCharacter`, `LottieCharacter`, `SpriteCharacter` unused-var fixes; `AuthContext` refresh rule override; `_` prefix rule for intentional unused vars.
- **`frontend/vitest.config.ts`**: `environment: 'node'`, `passWithNoTests`.
- **`.gitignore`**: Stopped ignoring `server/.env.example` so template can be committed.
- **`.env.example`**: Added `server/.env.example`, `frontend/.env.example`.
- **`migrate.ts`**: Seed user includes `provider: 'local'`.

## Phase 4 — Verify

- Ran `npm run lint`, `npm run build`, `npm test` from repo root — **passed** (server Vitest: `src/config/env.test.ts`; frontend: no tests yet, exit 0 with `--passWithNoTests`).
- Ran `cd frontend && npm run typecheck` — **passed** after removing unused default `React` imports (jsx: `react-jsx`) and fixing `FeedbackViewer` conditional render typing for `unknown` suggestions.
- **Not run in this session**: `npm run smoke` (needs live API + MongoDB + optional OpenAI), full manual browser E2E.

## Phase 5 — Documentation

- Created `delivery-workspace/*` (this log, audit, architecture, test plan, deployment, security, tech debt, next steps, agents).
- Created `project-architecture/*` (broader architecture/testing reference for future work).

## Continuation (2025-03-24)

Ongoing product/engineering work from continuation sessions is logged in **`/continuation-workspace/`** (`CURRENT_STATE.md`, `ACTIONS_LOG.md`, `NEXT_STEPS.md`, etc.).
