# Current state — UtopiaHire

**As of:** 2025-03-24 (this reconstruction + session changes).

## What the app is

- **Monorepo:** `frontend` (Vite + React + TS), `server` (Express + Mongoose + MongoDB), `shared` (shared types + CV compile helpers), `edge` (Deno scripts, parallel to main API).
- **User-facing product:** Authenticated users can (1) use **CV Pro** (`CvStudio`) for Tunisia-oriented CV diagnosis (with free vs Pro tier behavior), job match, and section rewrite; (2) use **Créer mon CV** (`CvBuilder`) to build structured CVs, save drafts, publish to resumes, or send compiled text to CV Pro; (3) use **Mode classique** to upload PDF/DOCX/TXT (or paste text), view versions, run legacy OpenAI “process”, and see structured feedback.

## What exists and works (verified in code + build)

- Auth: signup, login, JWT, `GET /auth/me` including `plan` (`free` | `pro`).
- Resume CRUD surface: upload, create, list, versions, feedbacks, process version, download text, accept, tailor (tailor/accept not all wired in UI).
- CV Pro API: `/cv/diagnosis`, `/cv/rewrite-section`, `/cv/job-match`, `/cv/builder/*` with auth and tier rules (see `server/src/routes/cvPremium.ts`).
- Frontend modes in `App.tsx`: classic / cvpro / cvbuilder; CV builder → CV Pro text seed; **publish → classic + selected resume** (this session).
- Security baseline from earlier work: ownership checks on resume/version routes, rate limits, helmet, CORS config (see `delivery-workspace/` and `project-architecture/`).

## What was incomplete / weak before this session

- Classic mode had **no UI** for `GET /resumes` — users could not pick an existing CV after publish from the builder or returning visits.
- **No visible plan / account context** in the shell — harder to justify upgrades.
- **Download** API existed but was **not exposed** in `FeedbackViewer`.
- Mixed EN/FR copy in classic viewer vs Tunisia-focused CV Pro.

## What this session added (summary)

- `listResumes`, `fetchMe`, `downloadVersionText` in `frontend/src/lib/api.ts`.
- `ClassicResumePicker`, `AppUserBar` components; `App.tsx` wiring; `FeedbackViewer` download + FR labels; `CvBuilder` `onPublished` callback.
- `project-architecture/API_MAP.md` — `/auth/me` response note for `plan`.

## Inferred (not fully exercised in runtime this session)

- End-to-end browser QA (signup → builder publish → classic process) — **manual recommended**.
- Payment / Stripe — **not implemented**; `plan` is schema-only unless set in DB.
- README still contains **historical / contradictory** Postgres vs Mongo notes (known tech-debt).

## Prior documentation (still authoritative for depth)

| Area | Folder |
|------|--------|
| Production / security audit | `delivery-workspace/` |
| Architecture & API | `project-architecture/` |
| CV Tunisia product | `cv-tool-tunisia-workspace/` |
| Runtime smoke history | `runtime-validation/` |

## Build / test status (automated, this session)

- `npm run build` — pass  
- `npm run lint` — pass  
- `npm test` — server Vitest pass; frontend no test files
