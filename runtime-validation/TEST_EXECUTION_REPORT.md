# Test execution report

## Automated

| Check | How | Result |
|-------|-----|--------|
| ESLint (frontend) | `npm run lint:frontend` | **PASS** |
| Typecheck (server) | `npm run lint:server` → `tsc --noEmit` | **PASS** |
| Production build | `npm run build` | **PASS** |
| Server unit tests | `cd server && npm test` (Vitest) | **PASS** — 3 tests in `src/config/env.test.ts` |
| Frontend unit tests | `cd frontend && npm test` | **PASS** — no test files; `--passWithNoTests` |
| Frontend typecheck | `npm run typecheck` | **PASS** |
| API smoke script | `BASE=http://127.0.0.1:4020 node server/scripts/smokeTest.js` | **PASS** (AI step fails without key — documented) |

## Manual (browser)

**Tool:** Cursor IDE browser MCP (accessibility snapshot, not pixel screenshots).

| Flow | Steps | Expected | Actual | Result |
|------|-------|----------|--------|--------|
| Load app | Navigate to `http://127.0.0.1:5173/` | Login UI | Login UI | **PASS** |
| Switch to signup | Click “start your journey” | Signup fields | Name + Create Account (after fix) | **PASS** (after `AssistantCharacter` fix; **FAIL** before fix — click intercepted) |
| Signup | Fill name, email, password (≥8), submit | Token + main screen | Main app with upload | **PASS** |
| Upload + process (no AI) | Paste text, Upload & Process | Clear error; resume usable | Status + “Resume content” + Process with AI (after `ResumeUpload` fix) | **PASS** (after fix; before fix viewer stayed empty) |

## Not executed

| Item | Reason |
|------|--------|
| OpenAI success path | `OPENAI_API_KEY` empty in `server/.env` |
| File upload (binary PDF) | Not run in browser automation (paste-only path tested) |
| Logout / session refresh | Not systematically tested |
| Kaggle endpoint | Requires credentials + auth token manual call |
| Mobile viewport | Not tested |

## Blockers / limitations

- **Port 4000 conflict** on validator machine prevented default `npm run dev` for API without changing `PORT` or killing foreign process.
- **Foreign service on 4001** after failed `ts-node-dev` restart — transient environment issue; use a known-free port.
