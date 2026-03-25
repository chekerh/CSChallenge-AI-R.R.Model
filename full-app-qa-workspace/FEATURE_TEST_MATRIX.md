# Feature test matrix

| # | Feature / module | Purpose | Entry point | Criticality | Test method | Result | Notes |
|---|------------------|---------|-------------|-------------|-------------|--------|--------|
| 1 | Repo build | Ship artifacts | `npm run build` | P0 | Automated | **Pass** | shared + frontend + server |
| 2 | Lint / typecheck | Quality gate | `npm run lint`, frontend `typecheck` | P0 | Automated | **Pass** | |
| 3 | Server unit tests | Env helpers | `npm test` | P1 | Automated | **Pass** | 3 tests, `env.test.ts` only |
| 4 | Frontend unit tests | Regressions | `npm run test:frontend` | P2 | Automated | **N/A** | No test files |
| 5 | API health | Liveness | `GET /health` | P0 | curl | **Pass** | on 4011 |
| 6 | Auth signup | Account creation | `AuthForm` / `POST /auth/signup` | P0 | Browser MCP | **Pass** | New user `qa_e2e_*@example.com` |
| 7 | Auth login | Session | `POST /auth/login` | P0 | Smoke script | **Pass** | |
| 8 | Auth logout | End session | `AppUserBar` | P1 | Browser MCP | **Pass** | Returns to auth screen |
| 9 | `GET /auth/me` | Plan + profile | `fetchMe` | P1 | Indirect | **Pass** | Used by AppUserBar when logged in |
| 10 | Mode: CV Pro | Diagnosis, job, rewrite | `App` tabs → `CvStudio` | P0 | Browser MCP | **Partial** | UI OK; diagnosis **503** without OpenAI key |
| 11 | Mode: Créer mon CV | Structured builder | `CvBuilder` | P0 | Browser MCP | **Pass** | Form, publish enabled with name |
| 12 | Mode: Classic | Upload + viewer | `ResumeUpload`, `FeedbackViewer` | P0 | Browser MCP | **Pass** | After picker fix |
| 13 | Resume list | `GET /resumes` | `ClassicResumePicker` | P0 | Browser MCP | **Pass** | Labels disambiguated when duplicate titles |
| 14 | Publish → classic | Handoff | `CvBuilder.onPublished` | P0 | Browser MCP | **Pass** | Switches mode + selects new resume |
| 15 | Download version text | Export | `GET .../download` | P1 | Not clicked in MCP | **Pass (API exists)** | Button present when version loaded |
| 16 | Classic AI process | OpenAI rewrite | `POST .../process` | P0 | Smoke | **Fail (expected)** | `AI service not configured` without key |
| 17 | CV diagnosis API | OpenAI JSON | `POST /cv/diagnosis` | P0 | curl | **Fail (expected)** | HTTP 503 without key |
| 18 | Job match / rewrite (Pro) | Gated features | CV Pro sections 3–4 | P1 | Browser | **Pass (gating)** | Disabled / messaging for free tier |
| 19 | Mode switch buttons | Navigation | Header pills | P0 | Browser MCP | **Pass** | After `pointer-events-none` on classic BG |
| 20 | Kaggle proxy | Datasets | `GET /kaggle/datasets` | P3 | Not tested | **Not tested** | No UI |
| 21 | Google OAuth | SSO | — | P3 | Not present in routes | **N/A** | Packages exist; not wired in current routes |
| 22 | i18n | Localization | Mixed FR/EN | P2 | Visual | **Mixed** | Classic upload still EN-heavy |

**Legend:** P0 = blocking for core product; P1 = important; P2/P3 = nice-to-have or peripheral.
