# Technical debt and recommendations

## High impact

| Item | Recommendation |
|------|----------------|
| Synchronous OpenAI in HTTP | Introduce job queue + worker; return 202 + poll/WebSocket |
| No E2E coverage | Playwright happy path + one negative auth test |
| Unused dependencies | Remove `@supabase/supabase-js` or implement feature |
| README accuracy | Single stack story (Mongo + Mongoose) |

## Medium impact

| Item | Recommendation |
|------|----------------|
| Horizontal scaling uploads | S3 presigned URLs + metadata in Mongo |
| Legacy SQL migrations | Archive or delete to prevent confusion |
| `node-fetch` + shims | Native fetch on supported Node LTS |
| Duplicate type sources | Align `shared/` vs `server/src/types.ts` |

## Low effort quick wins

| Item | Action |
|------|--------|
| Browserslist warning | `npx update-browserslist-db@latest` |
| npm audit | Scheduled upgrade PR |
| Expose download in UI | Wire button to `GET .../download` if product wants export |

## Structural / naming

- Frontend package name `vite-react-typescript-starter` — rename to `utopiahire-frontend` in `package.json` for clarity (**optional**).

## Architectural risks

- Tight coupling of AI latency to user-facing HTTP.
- Mixed documentation implying Postgres migration path.

## Maintainability

- Good separation: routes vs `openai.ts` vs models.
- Consider extracting `resumeOwnership.ts` helper module if routes grow.
