# Agents guidance (future AI/code sessions)

## Project intent

Build a production-grade paid SaaS (UtopiaHire CV Pro Tunisia), not a demo.

## Hard rules

- Do not commit secrets or `.env` files.
- Do not weaken auth/ownership checks.
- All premium gating must be **server-side**.
- Admin writes must be audited.
- Prefer small, testable increments.

## Validation checklist before pushing

- `npm test`
- `npm run lint`
- `npm run build`
- Verify `.gitignore` covers env variants + artifacts
- Confirm no secrets in tracked files

## Code conventions

- TypeScript everywhere; avoid `any` unless truly needed.
- Prefer shared types from `shared/`.
- Error handling: user-safe messages; log details server-side without PII.

## Product rules

- Every feature must answer: “why would a user pay?”
- Build retention loops (job tracker, progress deltas).
- Keep Tunisia localization as a first-class concept.

