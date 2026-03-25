# Runtime validation — actions log

Chronological record of this validation session (actual commands and outcomes).

## 1. Automated checks (root)

| Time (order) | Command | Result |
|--------------|---------|--------|
| 1 | `npm run lint` | **PASS** (frontend ESLint + server `tsc --noEmit`) |
| 2 | `npm run build` | **PASS** (shared + frontend Vite + server `tsc`) |
| 3 | `npm test` | **PASS** (server Vitest 3 tests; frontend Vitest 0 files, exit 0) |
| 4 | `npm run typecheck` | **PASS** |

## 2. Environment / services

| Check | Command / action | Result |
|-------|------------------|--------|
| MongoDB | `mongosh --eval 'db.runCommand({ ping: 1 })' mongodb://127.0.0.1:27017` | **OK** `{ ok: 1 }` |
| Server `.env` | `cp server/.env.example server/.env` | Created for local run (file gitignored) |
| Migrate | `cd server && npx ts-node src/migrate.ts` | **PASS** (indexes + seed `test@local`) |

## 3. Launch attempts

| Attempt | Detail | Result |
|---------|--------|--------|
| API default port | `cd server && npm run dev` | **FAIL** `EADDRINUSE 0.0.0.0:4000` — foreign `node` PID 53833 already on 4000 |
| Health on 4000 | `curl http://127.0.0.1:4000/health` | HTML `Cannot GET /health` — **not** this Express app |
| API alt port | `PORT=4001 npm run dev` then `PORT=4020 npm run dev` | **4020** used for validation after 4001 became inconsistent (see below) |
| Frontend | `VITE_API_URL=http://127.0.0.1:4020 npm run dev -- --host 127.0.0.1 --port 5173` | **PASS** Vite ready |

## 4. Smoke test

| BASE | Result |
|------|--------|
| `http://127.0.0.1:4001` (after hot reload) | **FAIL** 404 Fastify-style `Route POST:/auth/signup not found` — wrong process on 4001 after `ts-node-dev` restart hit `EADDRINUSE` |
| `http://127.0.0.1:4020` | **PASS** signup/login/create; process returned `{ error: 'AI service not configured' }` (empty `OPENAI_API_KEY` — expected) |

## 5. Issues found → fixes applied

| Issue | Fix | Files |
|-------|-----|--------|
| Smoke: `@local` / `@example` emails rejected by strict regex | Allow single-label domains: `^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$` | `server/src/auth.ts` |
| Smoke: password `secret` &lt; 8 chars | Default + main flow use `secretpass` | `server/scripts/smokeTest.js` |
| Smoke: default email in `signup()` helper | `@example.com` | `server/scripts/smokeTest.js` |
| `ts-node-dev` restart `EADDRINUSE` leaves zombie listener | `--exit-child` on dev script | `server/package.json` |
| Auth UI: fixed characters `z-50` blocked “start your journey” | `interactive={false}` + `pointer-events-none` / low z; form `z-10` | `AssistantCharacter.tsx`, `AuthForm.tsx` |
| Upload: AI failure hid resume in viewer | Call `onUploaded(resumeId)` after successful upload; soft-fail message if process fails | `ResumeUpload.tsx` |

## 6. Re-test after fixes

| Command | Result |
|---------|--------|
| `npm run lint && npm run build && npm test` | **PASS** |
| `BASE=http://127.0.0.1:4020 node server/scripts/smokeTest.js` | **PASS** (process error expected without OpenAI) |

## 7. Manual browser validation (Cursor IDE browser)

| Step | Result |
|------|--------|
| Open `http://127.0.0.1:5173/` | **PASS** |
| Click “start your journey” (after character fix) | **PASS** — signup mode |
| Signup `uitest1774394800@example.com` / `validatepass1` | **PASS** — landed on main app |
| Paste text → Upload & Process (no OpenAI key) | **PASS** — message + **Resume content** visible + **Process with AI** |

## 8. Not done / limitations

- No screenshot files saved (snapshots were textual a11y tree only).
- Full AI happy path **not** verified (`OPENAI_API_KEY` empty).
- Port **4000** not cleared; another project may own it on this machine.
- Dev servers left running in background PIDs from this session (user should stop when done).
