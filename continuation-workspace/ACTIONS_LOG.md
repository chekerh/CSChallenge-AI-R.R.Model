# Actions log — continuation workspace

## 2025-03-24 — Reconstruction + product polish

### Phase 1 — Repository inspection

- Listed markdown docs under root (delivery-workspace, project-architecture, runtime-validation, cv-tool-tunisia-workspace).
- Grepped `TODO`/`FIXME` in TS/TSX — **none** in application sources.
- Read `README.md`, `project-architecture/FEATURE_INVENTORY.md`, `project-architecture/NEXT_STEPS.md`, `delivery-workspace/NEXT_STEPS.md`, `cv-tool-tunisia-workspace/NEXT_STEPS.md`.
- Confirmed no pre-existing `continuation-workspace/` — **created** this folder and files.
- Reviewed `frontend/src/lib/api.ts`, `App.tsx`, `FeedbackViewer.tsx`, `ResumeUpload.tsx`, `server/src/routes/resume.ts` (list + download routes), `AuthContext.tsx`.

### Phase 2 — Gap analysis (chosen targets)

1. **Classic flow:** expose resume list (`GET /resumes`) — highest impact for builder → classic and repeat users.
2. **Sellable shell:** show account email + **plan** + logout; light Pro upsell hint for free users.
3. **Export:** wire `GET /resumes/versions/:versionId/download` in UI.
4. **Consistency:** French labels in classic viewer aligned with CV Pro audience.

### Phase 3 — Code changes

| File | Change |
|------|--------|
| `frontend/src/lib/api.ts` | Added `listResumes`, `fetchMe`, `downloadVersionText`; DTOs `ResumeSummaryDto`, `MeDto`. |
| `frontend/src/components/ClassicResumePicker.tsx` | **New** — loads resumes, select opens `FeedbackViewer` target. |
| `frontend/src/components/AppUserBar.tsx` | **New** — `/auth/me`, plan badge, Pro hint, logout. |
| `frontend/src/App.tsx` | `AppUserBar`; `ClassicResumePicker` + `resumeListKey` refresh; `CvBuilder` `onPublished` → classic + select resume; upload increments refresh key; empty-state FR copy. |
| `frontend/src/components/CvBuilder.tsx` | `onPublished?: (resumeId: string)`; success copy branches. |
| `frontend/src/components/FeedbackViewer.tsx` | Download `.txt`; FR strings for main blocks; process button label. |
| `project-architecture/API_MAP.md` | Documented `/auth/me` includes `plan`. |

### Phase 4 — Validation

- `npm run build` (root) — **pass**
- `npm run lint` (root) — **pass**
- `npm test` (root) — **pass** (server tests only; frontend Vitest has no tests)

### Outcomes

- Classic mode is **usable** for users with multiple CVs and closes the loop from **Créer mon CV → Publier → traitement IA**.
- Account/plan visibility supports **monetization narrative** (upgrade path still backend/ops).

## 2026-03-25 — Full UI walkthrough (automated browser)

### What was exercised (buttons + flows)

- **Auth**: signup with email/password/name → authenticated shell appears.
- **Classic mode**: paste text → upload → resume appears in list → download text → AI process retry shows friendly config error when OpenAI not configured → delete resume with confirm.
- **CV Builder**: fill basic fields → save draft → publish to classic list → classic mode shows published resume.
- **CV Pro mode**: paste CV text → run diagnosis hits backend; request returns **503** when OpenAI key missing (expected for local without key).

### Issues found and fixed

- **AuthForm crash**: backend error payload could be an object; UI attempted to render it directly causing React to crash.
  - Fixed `frontend/src/components/AuthForm.tsx` to coerce errors to a safe string and handle missing `token` gracefully.

### Notes

- Local dev had a port collision on **:4000** with an unrelated process; for local testing the API can be run on another port via `server/.env` (ignored by git).
