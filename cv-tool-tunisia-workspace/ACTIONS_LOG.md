# Actions log — CV tool Tunisia workspace

## Session: product definition + initial implementation

### Documentation created (`/cv-tool-tunisia-workspace/`)

1. `PRODUCT_SPEC.md` — vision, scope, non-goals, monetization logic  
2. `TUNISIA_MARKET_FIT.md` — segments, languages, education framing  
3. `ARCHITECTURE.md` — modules, AI pipeline, storage evolution, billing plan  
4. `SCORING_ENGINE.md` — dimensions, transparency rules  
5. `REWRITE_ENGINE.md` — tones, anti-hallucination, API shape  
6. `ROLE_TARGETING.md` — target enum and tailoring mechanics  
7. `PRICING_AND_VALUE.md` — tiers, differentiation, retention  
8. `IMPLEMENTATION_PLAN.md` — MVP/V2/launch  
9. `ACTIONS_LOG.md` — this file  
10. `TEST_PLAN.md` — test matrix  
11. `AGENTS.md` — agent guidelines  
12. `NEXT_STEPS.md` — priorities  

### Code implemented (repository)

| Area | Files | Purpose |
|------|-------|---------|
| Shared package entry | `shared/index.ts`, `shared/package.json` exports | Re-export `types`, `constants`, `cvTypes` |
| Shared types | `shared/cvTypes.ts` | Diagnosis, scores, rewrite, job-match typings + `CV_TARGET_ROLES` |
| CV prompts | `server/src/cv/prompts.ts` | Tunisia + honesty + JSON instructions + target-role lenses |
| CV engine | `server/src/cv/engine.ts` | `runDeepDiagnosis`, `runRewriteSection`, `runJobMatch` + normalizers |
| OpenAI | `server/src/openai.ts` | Added `openaiChatJson()` (high token limits for audits) |
| Routes | `server/src/routes/cvPremium.ts` | Authenticated `POST /cv/diagnosis`, `/cv/rewrite-section`, `/cv/job-match` |
| App mount | `server/src/index.ts` | `app.use('/cv', apiLimiter, cvPremiumRouter)`; JSON body limit **2mb** |
| Workspace deps | `server/package.json`, `frontend/package.json` | `"@utopiahire/shared": "1.0.0"` |
| Frontend API | `frontend/src/lib/cvApi.ts` | Typed fetch helpers |
| UI | `frontend/src/components/CvStudio.tsx` | FR-first wizard; mirrors `CV_TARGET_ROLES` locally (Vite + CJS `export *` quirk) |
| App shell | `frontend/src/App.tsx` | Default **CV Pro** mode + toggle to classic upload flow |

### Assumptions

- OpenAI model follows JSON-shaped instructions; parsing uses existing `tryParseJSONLike` fallback.  
- Users accept French/English AI output quality of `gpt-4o-mini`; production may upgrade model.  

### Unresolved

- Billing and strict paywall  
- Persistent `CvAnalysis` collection  
- Real DOCX/PDF layout parser  
- Native copy review for all dialect preferences  

## 2026-03-25 — Product + QA pass (automated browser)

### Journeys completed

- Signup/login works end-to-end.
- Classic CV flow works end-to-end: upload → list → view → download text → retry AI processing → delete.
- CV Builder: draft save + publish creates a classic resume entry.
- CV Pro: diagnosis endpoint returns 503 when OpenAI not configured (expected); UI should surface friendly “set `OPENAI_API_KEY`” message.

### Key gaps noticed (money-making)

- No **pricing/upgrade** screen inside the app (only implicit Pro gating).
- No “job application workflow”: no **job tracker**, no **cover letter**, no **ATS export**, no **interview prep**.
- No Tunisia-specific “trust builders”: localized templates, French/English/Arabic switch, diploma phrasing helpers, or recruiter-style examples.
