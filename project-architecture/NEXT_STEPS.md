# Next steps

## Immediate

1. Validate full UI flow in browser: signup → upload → process → viewer (**manual**).
2. Align team on removing or using Supabase and Google OAuth packages.
3. Stage deploy with real `CORS_ORIGIN` and TLS.

## Short-term roadmap

1. E2E tests (Playwright) against `vite dev` + local API.
2. Supertest integration tests for resume ownership edge cases.
3. README rewrite; move obsolete content to `docs/history.md` if retention needed.
4. Structured logging + error IDs for support.

## Longer-term improvements

1. Async AI pipeline; user notifications when processing completes.
2. Resume sharing / public links (would need new auth model).
3. Admin dashboard for usage metrics.

## Suggested workflow for future Cursor sessions

1. Open `project-architecture/API_MAP.md` before adding routes.
2. Run `npm run lint && npm run build && npm test` before concluding.
3. Update `API_MAP.md` when routes change.
4. For security-sensitive edits, read `delivery-workspace/SECURITY_REVIEW.md` first.
