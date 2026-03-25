# Next steps

## Immediate

1. Run full manual QA using `delivery-workspace/TEST_PLAN.md` against a staging environment.
2. Set real `CORS_ORIGIN`, `JWT_SECRET`, and `MONGODB_URI` on staging; confirm `/health` and auth flows.
3. Run `npm run smoke` in `server/` with valid keys.

## Short term

1. Add Playwright (or Cypress) E2E: signup → upload text file → see AI block.
2. Consolidate `README.md` (Mongo only, remove obsolete Postgres section or move to `docs/archive/`).
3. Remove unused frontend dependency or implement intended Supabase feature.
4. Add Supertest + mongodb-memory-server for resume ownership regression tests.

## Longer term

1. Object storage for uploads (S3/GCS) + virus scanning if accepting arbitrary files.
2. Job queue for OpenAI (BullMQ / SQS) to avoid long HTTP requests and enable retries.
3. Structured logging (pino) + request IDs.
4. API versioning (`/v1/...`) if mobile or third-party clients expected.

## For Cursor / agent sessions

See `delivery-workspace/AGENTS.md` and `project-architecture/AGENTS.md`.
