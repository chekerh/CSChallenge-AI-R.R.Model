# Agent guidance (UtopiaHire)

## Project context

- Monorepo: `frontend` (Vite React), `server` (Express + Mongoose), `shared` (TS lib), `edge` (Deno scripts, separate from main API).
- **Source of truth for API behavior**: `server/src/routes/*.ts`, `server/src/auth.ts`.

## Safe workflow

1. Read existing files before editing; match import style and patterns.
2. After backend route changes, update **both** `frontend/src/lib/api.ts` and `project-architecture/API_MAP.md` (if that doc is maintained).
3. Run from root: `npm run lint && npm run build && npm test`.
4. Never commit secrets; use `.env.example` for new variables only.

## Do

- Preserve `requireAuth` + ownership checks on any new resume/version endpoints.
- Use `getJwtSecret()` / `getCorsOrigins()` from `server/src/config/env.ts` for new JWT or CORS usage.
- Keep `server/tsconfig.json` `include` limited to `src/**/*` so root-level configs are not emitted to `dist/`.

## Don’t

- Reintroduce duplicate `app.listen()` or `connect()` in `server/src/index.ts`.
- Use `resumeId` where the API expects `versionId` for `.../versions/:versionId/process`.
- Add new public endpoints that call paid APIs (OpenAI, Kaggle) without auth.

## Validation before finishing

- `npm run build` from repository root.
- If touching server auth/env: `cd server && npm test`.
- If touching resume security: manually verify another user’s IDs return 404.
