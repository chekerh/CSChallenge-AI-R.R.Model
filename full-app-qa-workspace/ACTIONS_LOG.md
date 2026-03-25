# Actions log — full-app QA

Chronological record.

## 2025-03-25

1. **Repository discovery** — Read root `package.json`, `server/package.json`, `server/.env.example`, `frontend/.env.example`; confirmed workspaces and scripts.
2. **Automated checks** — Ran `npm run build`, `npm run lint`, `npm test` from repo root → **all passed** (frontend Vitest: no tests).
3. **Environment probe** — `nc` to `127.0.0.1:27017` → **open**; `server/.env` **present**.
4. **Port 4000** — `curl /health` returned HTML 404 → **foreign service** on 4000, not UtopiaHire.
5. **Started API** — `cd server && PORT=4011 npm run dev` (background) → Mongo connected, `GET /health` → `{"ok":true,"db":"up"}`.
6. **Started UI** — `VITE_API_URL=http://127.0.0.1:4011 npm run dev` (background) on 5173.
7. **Browser MCP** — Navigated to `http://127.0.0.1:5173/`, exercised CV Pro, classic, builder, publish handoff, logout, signup.
8. **Bug: click intercepted** — Mode buttons blocked by classic layout SVG (`<rect>`). **Fix:** `pointer-events-none` on classic background wrapper in `App.tsx`.
9. **Bug: duplicate resume labels** — Two entries “resume.txt · date” indistinguishable. **Fix:** `ClassicResumePicker` appends `· #last6` of `_id` when title duplicates.
10. **Smoke test** — Initial `BASE=... cd server && npm run smoke` failed (BASE not applied to `npm`); **retry** `cd server && BASE=http://127.0.0.1:4011 npm run smoke` → signup/login/create OK; process → `AI service not configured`.
11. **API probe** — `POST /cv/diagnosis` with real JWT → **503** `AI service not configured` (no OpenAI key in env).
12. **Regression** — `npm run build` + `npm run lint` after fixes → **pass**.
13. **Documentation** — Created `/full-app-qa-workspace/*` (this file and companions).

## Files inspected (non-exhaustive)

- `frontend/src/App.tsx`, `ClassicResumePicker.tsx`, `AuthForm.tsx`, `api.ts`
- `server/scripts/smokeTest.js`, `server/src/index.ts` (implied via health)
- MCP browser snapshots for runtime UI

## Files changed

- `frontend/src/App.tsx`
- `frontend/src/components/ClassicResumePicker.tsx`
