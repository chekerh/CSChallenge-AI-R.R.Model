# Improvements applied

## 1. Resume picker in classic mode

**Why:** `GET /resumes` existed but the UI only set `resumeId` on new upload. Users publishing from the CV builder (or returning later) had no discoverable way to open an existing CV.

**Impact:** Core retention flow — multiple CVs and builder-to-classic pipeline are now supported without copying opaque IDs.

## 2. Publish handoff (builder → classic)

**Why:** After publish, instructions referenced “open classic mode” manually; friction and drop-off.

**Impact:** One-click continuity: new resume is selected and list refreshes; aligns product with a **paid** feeling of guided workflow.

## 3. Account bar with plan

**Why:** Free vs Pro differentiation was invisible in the shell; weak upgrade story.

**Impact:** Users see **Gratuit / Pro** and a short value line for free accounts; sets expectation for what money buys (full diagnosis, job match, rewrite).

## 4. Download version text

**Why:** API already supported export; missing UI left value on the table.

**Impact:** Users can take AI-processed or original text offline — practical deliverable for job applications.

## 5. French labels in classic viewer

**Why:** CV Pro and builder are FR-forward; classic mode felt like a different product.

**Impact:** More cohesive **Tunisia / bilingual** positioning and professional polish.

## 6. Documentation

**Why:** Continuation task required traceability for future agents and stakeholders.

**Impact:** `continuation-workspace/` plus `API_MAP.md` tweak reduce onboarding time and avoid re-discovery.
