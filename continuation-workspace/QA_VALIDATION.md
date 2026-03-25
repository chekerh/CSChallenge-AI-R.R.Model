# QA validation

## 2026-03-25 — Automated browser walkthrough

### Setup (local)

- Frontend dev server: Vite (port may vary).
- API server: Express (tested on `:4010` due to local port conflicts).
- MongoDB: local (`mongodb://localhost:27017/utopiahire`).

### Core journeys verified

- **Signup/login**: user can create account and authenticate.
- **Classic upload**: paste text → upload succeeds → resume appears in list.
- **Viewer actions**: download `.txt` works; “Traiter avec l’IA” returns a friendly message when OpenAI is not configured; delete removes resume and refreshes list.
- **Builder**: save draft works; publish creates a classic resume entry visible in the picker.
- **CV Pro**: diagnosis call reaches backend; when OpenAI missing, backend returns `503` (expected in local env).

### Bugs discovered

- Auth error rendering could crash when API returns an object payload; fixed in `frontend/src/components/AuthForm.tsx`.


## Automated (executed)

| Check | Result |
|-------|--------|
| `npm run build` (shared + frontend + server) | **Pass** |
| `npm run lint` (frontend ESLint + server `tsc --noEmit`) | **Pass** |
| `npm test` | **Pass** — `server/src/config/env.test.ts` (3 tests); frontend Vitest **no test files** |

## Not executed (manual / recommended)

| Area | Reason |
|------|--------|
| Browser E2E | No Playwright/Cypress in repo |
| Auth + list resumes with real Mongo | Requires running stack + credentials |
| Download file open in OS | Manual sanity |
| Plan badge with `plan: 'pro'` user | Requires DB update or seed |

## Regression risks flagged

- `ClassicResumePicker` depends on `GET /resumes` returning an array of objects with `_id` — matches Mongoose JSON serialization; if API shape changes, picker breaks.
- `fetchMe` assumes `/auth/me` JSON shape; already aligned with `auth.ts`.

## Honest assessment

The changes are **low-risk UI + API client** additions. Sellability still depends on **billing**, **legal/privacy pages**, and **content** (landing, pricing in TND) documented in `cv-tool-tunisia-workspace/` but not built in this session.
