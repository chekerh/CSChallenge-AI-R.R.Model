# Improvements applied

## 1. Resume list includes `version_count` (server)

**Why:** Orphan `Resume` documents (no `ResumeVersion`) appeared like normal CVs and led to an empty classic viewer (QA BUG-003).

**What:** `GET /resumes` now returns each resume with `version_count` (0 if none), sorted by `created_at` descending (unchanged intent).

**Impact:** Clients can label, filter, or disable broken rows without N+1 requests.

## 2. Classic resume picker UX (frontend)

**Why:** Users could not see which CVs had content; orphans were selectable.

**What:**

- Option labels include `— N version(s)` when the API provides counts.
- Rows with **`version_count === 0`** are **disabled** and labeled `0 version (incomplet)`.
- Amber helper text when any orphan exists.
- If the current selection becomes an orphan (explicit `0`), selection is **cleared** so the empty viewer is not shown for a “ghost” choice.
- Legacy responses **without** `version_count` behave as before (no disable, no auto-clear).

**Impact:** Clearer trust, fewer dead-end selections.

## 3. Feedback viewer empty state (frontend)

**Why:** Single-line error was easy to miss.

**What:** Two short paragraphs explaining the situation and next steps (pick another CV, re-import, use Créer mon CV).

**Impact:** Better recovery path without new routes.

## 4. Smoke test diagnostics (script)

**Why:** Wrong `BASE` produced `Unexpected token '<'` with no guidance (QA BUG-004).

**What:** Central JSON parse; on failure prints snippet + hint: `cd server && BASE=http://127.0.0.1:PORT npm run smoke`.

**Impact:** Faster local debugging for engineers.

## 5. API documentation

**What:** `API_MAP.md` notes `version_count` on list resumes.

## 6. Delete resume (server + client)

**Why:** Orphans and unwanted CVs could not be removed from the UI (`REMAINING_ISSUES`).

**What:** `DELETE /resumes/:resumeId` deletes feedbacks → versions → resume (owner-only). Client helper `deleteResume()`.

**Impact:** Data hygiene without Mongo shell.

## 7. Delete UX — viewer + picker

**Why:** Users need a safe, explicit removal path.

**What:** `FeedbackViewer` exposes destructive actions + `onDeleted` to refresh parent state. `ClassicResumePicker` adds bulk removal for all `version_count === 0` entries.

**Impact:** Orphans are one-click cleanable; normal CVs deletable with confirm.

## 8. Classic shell copy (FR)

**Why:** Mode classique mixed EN/FR vs CV Pro.

**What:** `App.tsx` classic title/subtitle/footer FR; `ResumeUpload` fully FR; status banners driven by `statusTone` instead of English substring heuristics.

**Impact:** More consistent Tunisia-facing product surface.

## 9. README accuracy

**What:** Stack table, removal of obsolete PostgreSQL quick-start from the main path, archive file for legacy text, valid example signup password (≥8 chars).

**Impact:** Fewer wrong-environment setups for new contributors.

## 10. CV Pro error copy (503)

**What:** `formatCvApiError` in `CvStudio` maps missing OpenAI to a French explanation pointing at `server/.env`.

**Impact:** Demos and local dev without keys are less confusing.

## 11. Frontend regression tests (`api.resume.test.ts`)

**What:** Vitest coverage for `deleteResume` and `listResumes` client helpers.

**Impact:** Safer refactors around resume API wiring.
