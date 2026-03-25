# Implementation plan

## MVP (this delivery phase)

- [x] Product + market + architecture docs (`/cv-tool-tunisia-workspace`)  
- [x] Shared TypeScript types for diagnosis / rewrite responses (`shared/cvTypes.ts`)  
- [x] Tunisia + honesty system prompts (`server/src/cv/prompts.ts`)  
- [x] OpenAI JSON helper (`openaiChatJson` in `server/src/openai.ts`)  
- [x] CV engine: diagnosis, rewrite-section, job-match (`server/src/cv/engine.ts`)  
- [x] API routes `POST /cv/diagnosis`, `/cv/rewrite-section`, `/cv/job-match` (`server/src/routes/cvPremium.ts`)  
- [x] Frontend **Cv Studio** wizard (`frontend/src/components/CvStudio.tsx` + `lib/cvApi.ts`)  
- [x] App integration: Classic vs **CV Pro** mode  

## V2

- Persist `CvAnalysis` in Mongo; history + diff  
- True PDF/DOCX structured parser (section detection) + manual section editor  
- Billing (Stripe or local) + quotas  
- Arabic UI shell + RTL  
- DOCX/PDF export with templates  
- Admin dashboard for prompt version A/B  

## Premium roadmap

- LinkedIn headline/summary generator (bundled)  
- Cover letter starter from CV + JD  
- Freelancer bio + platform-specific variants  
- “Recruiter mode” stricter tone  

## Testing milestones

- Parser golden files (10 CVs)  
- Prompt regression (no fabricated employers in fixtures)  
- FR/EN native speaker spot-check  

## Launch milestones

- Private beta: 20 Tunisian users, interview feedback  
- Public landing + paywall  
- Content: 3 example before/afters (anonymized)  

## Current limitations (explicit)

- Section boundaries: **text-first**; heavy layout PDFs may parse as flat text.  
- Billing: **not** implemented in this phase.  
- Free/paid split: **soft** (same endpoints; document recommends gating next).
