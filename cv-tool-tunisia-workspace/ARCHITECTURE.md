# System architecture (CV Pro Tunisia / UtopiaHire codebase)

## High-level

```mermaid
flowchart LR
  subgraph client [React SPA]
    Studio[CvStudio]
    Classic[Resume upload flow]
  end
  subgraph api [Express API]
    Auth[/auth]
    Res[/resumes]
    CV[/cv/*]
  end
  subgraph ai [OpenAI]
    OAI[Chat Completions JSON mode]
  end
  subgraph data [MongoDB]
    User
    Resume
    ResumeVersion
    Feedback
  end
  Studio --> CV
  Classic --> Res
  CV --> OAI
  Res --> OAI
  CV --> data
  Res --> data
```

## Modules (target end-state)

| Module | Responsibility | Current repo status |
|--------|----------------|---------------------|
| Auth | JWT, users | Implemented (`server/src/auth.ts`) |
| CV intake | Upload, parse, structure | Partial: file + text via `/resumes` |
| Structured profile | Canonical section model | **New:** `shared/cvTypes.ts` + parser pass in AI |
| Diagnosis | Deep audit JSON | **New:** `POST /cv/diagnosis` |
| Rewrite | Section rewrites + tones | **New:** `POST /cv/rewrite-section` |
| Job match | JD vs CV | **New:** `POST /cv/job-match` |
| Targeting | Role presets | **New:** prompt + `targetRole` enum |
| Scoring | Multi-dimension + explain | Inside diagnosis payload |
| Export | DOCX/PDF | **Planned** — text export first |
| Billing | Stripe + quotas | **Planned** — `plan: free|pro` header or user field |
| Analytics | Events | **Planned** |

## AI pipeline

1. **System prompt** — Tunisia context + anti-hallucination rules (`server/src/cv/prompts.ts`).  
2. **User payload** — raw CV text + `outputLanguage` + `targetRole` + optional JD.  
3. **Model** — `OPENAI_MODEL` (default `gpt-4o-mini`); increase tokens for full audits in production.  
4. **Parse** — JSON extraction with fallback (`server/src/openai.ts` pattern).  
5. **Persist** — optional: store in `Feedback` or new `CvAnalysis` collection (future).

## Storage model (evolution)

- Today: `Resume`, `ResumeVersion`, `Feedback` (Mongoose).  
- **MVP:** Analysis returned to client; client can re-run.  
- **V2:** `CvAnalysis` document: `{ userId, resumeVersionId, diagnosis, jobMatch, createdAt }`.

## Data flow (diagnosis)

1. User pastes CV or selects uploaded version text.  
2. `POST /cv/diagnosis` with `{ text, outputLanguage, targetRole }`.  
3. Server loads OpenAI, returns structured audit + scores + section findings.  
4. UI renders priority list, expandable sections, before/after placeholders.

## Billing integration (plan)

- Stripe Customer + Subscription; webhook sets `user.plan`.  
- Middleware `requirePro` on `/cv/rewrite-section`, `/cv/job-match` (full payload).  
- Free tier: truncated `top_fixes` only.

## Feature flags

- Env `CV_FREE_DIAGNOSIS_MAX_CHARS`, `CV_PRO_FEATURES=true|false` for staged rollout.
