# API map

Base URL: server root (e.g. `http://127.0.0.1:4000`). Routers mounted in `server/src/index.ts`.

## Health

| Method | Path | Auth | Purpose | Handler / file |
|--------|------|------|---------|----------------|
| GET | `/health` | No | Liveness + Mongo state | `index.ts` |

## Auth (`/auth`)

| Method | Path | Auth | Body | Response notes | File |
|--------|------|------|------|----------------|------|
| POST | `/auth/signup` | No | `{ email, password, name? }` | `{ token }` or 409 | `auth.ts` |
| POST | `/auth/login` | No | `{ email, password }` | `{ token }` | `auth.ts` |
| GET | `/auth/me` | Bearer | — | `{ email, name?, created_at?, plan? }` — `plan` is `free` or `pro` (default `free`) | `auth.ts` |

## Resumes (`/resumes`)

| Method | Path | Auth | Purpose | File |
|--------|------|------|---------|------|
| POST | `/resumes/upload` | Bearer | Multipart upload + original version | `routes/resume.ts` |
| POST | `/resumes/create` | Bearer | JSON text-only create | `routes/resume.ts` |
| GET | `/resumes` | Bearer | List current user’s resumes (each item includes `version_count`) | `routes/resume.ts` |
| DELETE | `/resumes/:resumeId` | Bearer | Delete resume + versions + related feedbacks (owner-only) | `routes/resume.ts` |
| GET | `/resumes/:resumeId/versions` | Bearer | List versions (owner-only) | `routes/resume.ts` |
| POST | `/resumes/versions/:versionId/feedback` | Bearer | Add feedback record | `routes/resume.ts` |
| GET | `/resumes/versions/:versionId/feedbacks` | Bearer | List feedbacks | `routes/resume.ts` |
| POST | `/resumes/versions/:versionId/process` | Bearer | OpenAI process (owner-only) | `routes/resume.ts` |
| POST | `/resumes/:resumeId/accept` | Bearer | Create `final` version | `routes/resume.ts` |
| POST | `/resumes/:resumeId/tailor` | Bearer | Industry-tailored analysis | `routes/resume.ts` |
| GET | `/resumes/versions/:versionId/download` | Bearer | Plain text body | `routes/resume.ts` |

## Kaggle (`/kaggle`)

| Method | Path | Auth | Purpose | File |
|--------|------|------|---------|------|
| GET | `/kaggle/datasets` | Bearer | Proxied dataset list | `routes/kaggle.ts` |

## Payload / response notes

- IDs are Mongo ObjectId strings.
- AI `suggestions` stored as `Schema.Types.Mixed`; shape from OpenAI prompt (JSON with `suggestions`, `improved_text`, etc.).
- Errors typically `{ error: string }` with 4xx/5xx.
