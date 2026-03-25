# Actions log (architecture documentation)

## Scope

Documentation pass aligned with repository analysis performed during the production-readiness delivery. See also `delivery-workspace/ACTIONS_LOG.md` for code changes.

## Repository inspection

- Listed workspaces: `frontend/`, `server/`, `shared/`, `edge/`, root scripts.
- Traced primary user journey: `frontend/src/App.tsx` → `AuthForm` → `ResumeUpload` → `FeedbackViewer`.
- Mapped API surface from `server/src/index.ts` router mounts and route files.
- Reviewed Mongoose models under `server/src/models/`.
- Noted non-integrated pieces: `edge/`, SQL files under `server/migrations/`, unused Supabase dependency.

## Generated files (this folder)

- `ARCHITECTURE.md` — system overview.
- `FEATURE_INVENTORY.md` — feature list and status.
- `TEST_PLAN.md` — testing matrix (mirrors/extends delivery test plan).
- `FOLDER_STRUCTURE.md` — directory purposes.
- `DATA_FLOW.md` — request/data paths.
- `API_MAP.md` — endpoint reference.
- `AUTH_AND_SECURITY.md` — security-focused view.
- `TECH_DEBT_AND_RECOMMENDATIONS.md` — debt and priorities.
- `NEXT_STEPS.md` — roadmap.
- `AGENTS.md` — instructions for future agents.

## Assumptions

- MongoDB is the authoritative database for the shipped app (**confirmed** by Mongoose usage).
- SQL migrations are legacy artifacts (**inferred** from README history).

## Uncertainties / needs verification

- Whether `shared/` types are consumed by frontend in production bundle (grep before refactor).
- Exact production hosting target (Vercel+Railway, single VM, etc.).
