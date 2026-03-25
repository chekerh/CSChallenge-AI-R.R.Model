# Folder structure

| Path | Purpose | Notes |
|------|---------|--------|
| `/frontend/` | Vite React SPA | Primary UI; `src/lib/api.ts` is the API client |
| `/server/` | Express API | `src/index.ts` entry; `dist/` build output |
| `/shared/` | Shared TypeScript package | Built via root `npm run build:shared` |
| `/edge/` | Deno-oriented scripts | Parallel to main server; not imported by Express |
| `/server/migrations/*.sql` | Legacy SQL | **Do not use** for current Mongo stack without verification |
| `/server/uploads/` | Runtime uploads | Gitignored; created by multer |
| `/server/scripts/smokeTest.js` | Smoke test | Node script against running API |
| `/delivery-workspace/` | Production delivery docs | Audit, deployment, security |
| `/project-architecture/` | Deep architecture docs | This folder |

## What is organized well

- Clear split between frontend and server.
- Models colocated under `server/src/models/`.

## What could improve

- Consolidate duplicate API base configuration history (`VITE_API_URL` vs `VITE_API_BASE`) — partially addressed in code.
- Move obsolete SQL migrations to `docs/archive/` or delete with team sign-off.
- Add `e2e/` or `tests/` at root for cross-package automation.
