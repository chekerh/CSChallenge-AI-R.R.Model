# Feature inventory

| Feature | Purpose | Main files | Entry points | Dependencies | Status | Risks / gaps |
|---------|---------|------------|--------------|--------------|--------|--------------|
| User signup | Create local account | `server/src/auth.ts` | `POST /auth/signup` | MongoDB User, bcrypt, jwt | Implemented | Was upsert-overwrite; now 409 on duplicate |
| User login | Obtain JWT | `server/src/auth.ts` | `POST /auth/login` | MongoDB, bcrypt, jwt | Implemented | — |
| Current user | Profile snippet | `server/src/auth.ts` | `GET /auth/me` | MongoDB | Implemented | — |
| Auth UI | Login/signup form | `frontend/src/components/AuthForm.tsx` | Rendered from `App.tsx` | `API_BASE` fetch | Implemented | — |
| Resume upload (multipart) | File → text extraction → version | `server/src/routes/resume.ts` | `POST /resumes/upload` | multer, pdf-parse, mammoth | Implemented | Local disk only |
| Resume create (JSON) | Text-only create | `server/src/routes/resume.ts` | `POST /resumes/create` | — | Implemented | Smoke test uses this |
| List resumes | Dashboard data | `server/src/routes/resume.ts` | `GET /resumes` | — | Implemented | Frontend list UI not prominent in `App.tsx` |
| List versions | History per resume | `server/src/routes/resume.ts` | `GET /resumes/:resumeId/versions` | — | Implemented | Used by `FeedbackViewer` |
| Save feedback | Store suggestion blob | `server/src/routes/resume.ts` | `POST /resumes/versions/:versionId/feedback` | — | Implemented | Rarely used from UI |
| List feedbacks | Read suggestions | `server/src/routes/resume.ts` | `GET /resumes/versions/:versionId/feedbacks` | — | Implemented | Used by `FeedbackViewer` |
| AI process version | OpenAI rewrite + new version | `server/src/routes/resume.ts`, `openai.ts` | `POST /resumes/versions/:versionId/process` | OpenAI | Implemented | Needs API key |
| Accept version | Copy to `final` label | `server/src/routes/resume.ts` | `POST /resumes/:resumeId/accept` | — | Implemented | **Unclear** if exposed in UI |
| Tailor by industry | AI with industry hint | `server/src/routes/resume.ts` | `POST /resumes/:resumeId/tailor` | OpenAI | Implemented | **Unclear** if exposed in UI |
| Download version text | Plain text body | `server/src/routes/resume.ts` | `GET /resumes/versions/:versionId/download` | — | Implemented | **Unclear** if exposed in UI |
| Kaggle proxy | Dataset search | `server/src/routes/kaggle.ts` | `GET /kaggle/datasets` | Kaggle API | Implemented | Not referenced in frontend (**inferred**) |
| Health | Liveness/readiness | `server/src/index.ts` | `GET /health` | mongoose | Implemented | — |
| Edge OpenAI/Kaggle | Standalone Deno scripts | `edge/openai_processor.ts`, `edge/kaggle_fetcher.ts` | CLI / edge deploy | — | Partial / parallel | Not wired to Express |
