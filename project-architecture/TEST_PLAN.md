# Test plan (architecture / QA matrix)

## Recommended tooling (based on stack)

| Layer | Tool | Rationale |
|-------|------|-----------|
| Server unit | Vitest | Already in `server/package.json` |
| Server integration | Supertest + mongodb-memory-server | In-process HTTP + isolated DB |
| Frontend unit | Vitest + React Testing Library | Matches Vite |
| E2E | Playwright | Stable for Vite dev server + API |

## Feature: Authentication

| Scenario | Level | Priority | Automation | Expected |
|----------|-------|----------|------------|----------|
| Signup success | Integration | P0 | High | 200 + token |
| Duplicate email | Integration | P0 | High | 409 |
| Login success | Integration | P0 | High | 200 + token |
| Login failure | Integration | P0 | High | 401 |
| JWT on protected route | Integration | P0 | High | 401 without, 200 with |
| Invalid email format | Unit/API | P1 | Medium | 400 |

## Feature: Resume upload & versions

| Scenario | Level | Priority | Automation | Expected |
|----------|-------|----------|------------|----------|
| Multipart upload PDF | Integration | P0 | Medium | version created |
| Text-only create | Integration | P0 | High (smoke) | version created |
| List versions for own resume | Integration | P0 | High | 200 array |
| List versions for other user | Integration | P0 | High | 404 |
| File too large | Integration | P1 | Medium | 400 |

## Feature: AI processing

| Scenario | Level | Priority | Automation | Expected |
|----------|-------|----------|------------|----------|
| Process own version | E2E / manual | P0 | Low (cost) | improved version |
| Process without API key | Integration | P0 | High | 503 |
| Process other user’s version | Integration | P0 | High | 404 |

## Feature: Frontend UX

| Scenario | Level | Priority | Automation | Expected |
|----------|-------|----------|------------|----------|
| Upload + process flow | E2E | P0 | Medium | Viewer shows text + suggestions |
| Version dropdown switches content | E2E | P1 | Medium | Correct `content_text` |
| Loading / error states | Manual | P2 | Low | No uncaught errors |

## Role-based access

- Only **authenticated** users; verify cross-user 404s on all resume/version routes.

## Performance

| Check | Method | Note |
|-------|--------|------|
| Concurrent uploads | k6/Locust | Optional |
| OpenAI latency | APM | Track p95 |

## Security

| Check | Method | Expected |
|-------|--------|----------|
| Rate limit auth | Script | 429 after threshold |
| CORS from bad origin | Browser devtools | Blocked |

## Failure cases

- Mongo down → `/health` 503.
- OpenAI 5xx → 500 from process (logged server-side).
- Malformed multipart → 400 from multer.
