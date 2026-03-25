# Agent instructions — CV Pro Tunisia (UtopiaHire repo)

## Context

- Monorepo: `frontend` (Vite React), `server` (Express), `shared` (types).  
- Premium CV features live under **`/cv`** API and **`CvStudio`** UI.  
- Product docs: **`/cv-tool-tunisia-workspace/`**.

## Conventions

- **Never** weaken anti-hallucination rules in `server/src/cv/prompts.ts` without product sign-off.  
- All new CV responses should align with **`shared/cvTypes.ts`**.  
- Prefer **`openaiChatJson`** for new OpenAI features (structured output).  
- Keep **`requireAuth`** on `/cv/*` routes.

## Safe workflow

1. Edit prompts → run `npm run build:server` and a manual API call with fixture CV.  
2. Edit shared types → `cd shared && npm run build` (or root `npm run build:shared`).  
3. Run `npm run lint && npm run build` from root before finishing.

## Do not

- Add fabricated employer/university lists as if user worked there.  
- Return a single “ATS score” number without dimension breakdown.  
- Bypass auth for paid-grade endpoints when billing is enabled.

## Validation checklist

- [ ] Typecheck server + frontend  
- [ ] Manual: diagnosis + rewrite + job match in CV Pro UI  
- [ ] Verify JSON keys match `cvTypes` consumers  
