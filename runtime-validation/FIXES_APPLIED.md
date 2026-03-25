# Fixes applied during runtime validation

## 1. Email validation for dev/smoke (`server/src/auth.ts`)

- **Why:** Regex required `user@domain.tld` with a dot, rejecting `*@local` and breaking `smokeTest.js`.
- **Change:** `EMAIL_RE` → `^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$` (allows single-label domains).
- **Impact:** Local/test emails work; still rejects addresses without `@`.

## 2. Smoke script credentials (`server/scripts/smokeTest.js`)

- **Why:** Password `secret` is 6 characters; API requires ≥8. Email `@local` failed old regex.
- **Change:** `*@example.com` + password `secretpass`.
- **Impact:** `npm run smoke` succeeds through create; process still depends on OpenAI env.

## 3. `ts-node-dev` child exit (`server/package.json`)

- **Why:** On reload, old listener could remain → `EADDRINUSE` and wrong process answering HTTP.
- **Change:** `dev` script adds `--exit-child`.
- **Impact:** Safer local iteration; verify on your OS if issues persist.

## 4. Auth form click-through (`frontend/src/components/AssistantCharacter.tsx`, `AuthForm.tsx`)

- **Why:** Decorative characters sat above interactive auth controls.
- **Change:** Optional `interactive` prop; `AuthForm` sets `interactive={false}`; form/header `relative z-10`.
- **Impact:** Signup/login toggles and fields receive clicks; hover-only character chrome disabled on auth.

## 5. Resume visible when AI offline (`frontend/src/components/ResumeUpload.tsx`)

- **Why:** Users lost access to uploaded content if OpenAI step failed.
- **Change:** `onUploaded(resumeId)` immediately after successful upload; non-throwing branch for process failure with retry copy.
- **Impact:** Viewer shows `original` version; “Process with AI” remains available.

## Re-validation

- `npm run lint && npm run build && npm test` — all passed after these edits.
- Browser retest: upload without OpenAI shows resume content and retry message.
