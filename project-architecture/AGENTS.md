# Agent instructions (UtopiaHire repo)

## Project context

- **Product**: Resume upload + AI feedback (OpenAI) with MongoDB persistence.
- **Run dev**: root `npm run dev` (frontend + server) or separately per workspace README.
- **Critical files**: `server/src/index.ts`, `server/src/routes/resume.ts`, `server/src/config/env.ts`, `frontend/src/lib/api.ts`.

## Important folders

| Folder | Use |
|--------|-----|
| `server/src/routes/` | HTTP API surface |
| `server/src/models/` | Mongoose schemas |
| `frontend/src/components/` | UI |
| `delivery-workspace/` | Production audit & deployment notes |
| `project-architecture/` | Deep-dive docs including this file |

## Conventions (inferred from codebase)

- TypeScript strict in server; ESLint + TypeScript in frontend.
- Express routers in separate files; default export router.
- API errors as JSON `{ error: string }`.
- Environment via `server/.env`; never commit secrets.

## Do

- Preserve authentication and **ownership checks** on resume/version mutations.
- Use `versionId` for `/resumes/versions/:versionId/process` (not `resumeId`).
- Add new env vars to `server/.env.example` and `DEPLOYMENT_CHECKLIST.md`.

## Don’t

- Start the HTTP server twice or call `connect()` redundantly.
- Expose OpenAI or Kaggle proxies without authentication.
- Change JWT payload shape without updating `authMiddleware` and client storage assumptions.

## Validate before finishing

```bash
npm run lint && npm run build && npm test
```

For auth/env changes, also `cd server && npm test`.

## Documentation hygiene

- After meaningful API or security changes, update `project-architecture/API_MAP.md` and `delivery-workspace/PRODUCTION_READINESS_AUDIT.md` (remaining items section).
