# Fixes applied (this QA pass)

## 1. Classic layout: non-interactive background

**File:** `frontend/src/App.tsx`  
**Change:** Added `pointer-events-none` to the absolute “Background decoration” wrapper in classic mode.  
**Why:** SVG `<rect>` elements were receiving pointer events and blocked clicks on global header controls (mode switch, etc.).  
**Impact:** Mode switching and other top-of-page interactions work reliably from classic mode.

## 2. Resume picker: disambiguate duplicate titles

**File:** `frontend/src/components/ClassicResumePicker.tsx`  
**Change:** Introduced `optionLabel()` — when more than one resume shares the same title string, append `· #xxxxxx` using the last 6 characters of `_id`.  
**Why:** Users could not distinguish multiple CVs with identical titles and dates.  
**Impact:** Safer selection in “Mes CV”; reduced risk of editing wrong document.

## Re-test after fixes

- `npm run build` — **pass**
- `npm run lint` — **pass**
- Browser: classic ↔ CV Pro toggle — **pass** (post-reload with HMR/build)

No server-side code was modified in this pass.
