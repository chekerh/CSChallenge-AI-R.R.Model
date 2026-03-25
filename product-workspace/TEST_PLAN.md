# Test plan

## Unit tests

- Shared types/utilities: `shared/`
- Frontend API helpers: `frontend/src/lib/api.ts`, `cvApi.ts`
- Server env/config validation: `server/src/config/env.ts`

## Integration tests (server)

- Auth: signup/login/me
- Resumes:
  - upload/create
  - list ownership
  - delete ownership
  - process version (mock OpenAI)
- CV Pro:
  - diagnosis (mock OpenAI)
  - pro-only endpoints enforce plan

## E2E tests (Playwright)

### User journey
- Signup → classic upload → see in list → download → delete
- Builder → publish → appears in classic
- CV Pro diagnosis (mock AI) → results render
- Upgrade flow (when billing implemented)

### Admin journey
- Admin login → edit pricing content → publish → pricing page updates
- Update settings (quota) → user hits quota → sees correct message
- Audit log contains admin actions

## Manual QA scenarios

- Corrupt PDF upload
- Large CV text truncation messaging
- Disabled Pro features show clear upgrade prompts
- Payment failure states: grace, restricted, resume access preserved

## Performance checks

- Upload and parse time for PDF/DOCX
- AI endpoint latency and timeout handling
- Mongo query performance on resume lists at 100+ resumes/user

## Security checks

- Auth brute force (rate limits)
- Ownership enforcement on resume routes
- Admin routes blocked for non-admin
- Webhook signature verification (billing)

