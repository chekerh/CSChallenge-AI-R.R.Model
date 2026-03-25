# Bug report — full-app QA

## BUG-001 — Classic decorative SVG intercepts header / mode button clicks

| Field | Detail |
|-------|--------|
| **Severity** | **High** (navigation / mode switch broken from classic view) |
| **Reproduction** | 1) Log in. 2) Open “Mode classique”. 3) Scroll/layout such that SVG overlay aligns with top nav. 4) Click “Mode CV Pro (Tunisie)”. |
| **Expected** | Mode switches to CV Pro. |
| **Actual** | Click intercepted by `<rect>` (decorative pattern SVG). |
| **Root cause** | Absolute-positioned background SVGs participate in hit-testing. |
| **Status** | **Fixed** — `pointer-events-none` on classic background wrapper (`App.tsx`). |
| **Verification** | Browser: classic → CV Pro click **Pass** after fix + reload. |

---

## BUG-002 — Duplicate resume titles in picker are indistinguishable

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** (wrong resume can be selected) |
| **Reproduction** | Create two resumes with same title (e.g. default `resume.txt`). Open classic picker. |
| **Expected** | User can tell entries apart. |
| **Actual** | Identical option labels. |
| **Root cause** | Option text used only title + date. |
| **Status** | **Fixed** — append `· #<last 6 of _id>` when same title appears multiple times (`ClassicResumePicker.tsx`). |
| **Verification** | Code review + logic; full visual re-check **recommended** after deploy. |

---

## BUG-003 — Resume in list with zero versions shows empty viewer

| Field | Detail |
|-------|--------|
| **Severity** | **Medium** (confusing empty state) |
| **Reproduction** | Select resume `69c31d8feca23706d7b0aa97` in QA DB (orphan or failed upload). |
| **Expected** | Either no orphan resumes, or UI explains “no versions”. |
| **Actual** | Message: no versions for this CV. |
| **Root cause** | **Data integrity** (resume without `ResumeVersion`) or historical failed flow — **not proven as live code bug** in this pass. |
| **Status** | **Not fixed** (no server change). Optional hardening: filter list to resumes with ≥1 version, or delete orphans in migration. |
| **Verification** | **Needs verification** on clean DB after migrate. |

---

## BUG-004 — Smoke test `BASE` env easy to misuse

| Field | Detail |
|-------|--------|
| **Severity** | **Low** (developer experience) |
| **Reproduction** | `BASE=http://127.0.0.1:4011 cd server && npm run smoke` (BASE may not apply to `npm run` depending on shell). |
| **Expected** | Smoke hits intended API. |
| **Actual** | Hit wrong port → HTML instead of JSON. |
| **Root cause** | Shell env scoping. |
| **Status** | **Not fixed** in code; **documented** in `RUN_GUIDE.md` (`cd server && BASE=... npm run smoke`). |

---

## BUG-005 — AI features fail when `OPENAI_API_KEY` unset

| Field | Detail |
|-------|--------|
| **Severity** | **N/A** (configuration) / **High** if claimed “production” without key |
| **Reproduction** | Omit or empty `OPENAI_API_KEY`; call `POST /cv/diagnosis` or resume `process`. |
| **Expected** | Clear error. |
| **Actual** | 503 / `{ "error": "AI service not configured" }` (smoke) — **acceptable**. |
| **Status** | **Not a defect** — by design for this codebase. |
