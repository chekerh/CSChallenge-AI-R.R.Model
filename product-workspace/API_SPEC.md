# API spec (high-level)

## Conventions

- Auth: `Authorization: Bearer <jwt>`
- Error shape: `{ error: string }` with HTTP status codes
- Admin routes require admin role
- Quota exceeded errors use `429` with `{ error, limit_key }`

## Public/Auth

- `POST /auth/signup` → `{ token }`
- `POST /auth/login` → `{ token }`
- `GET /auth/me` → `{ email, name, plan, role? }`

## Classic resumes

- `POST /resumes/upload` (multipart) → `{ resumeId, versionId }`
- `POST /resumes/create` (json) → `{ resumeId, versionId }`
- `GET /resumes` → `[ { _id, title, created_at, version_count } ]`
- `GET /resumes/:resumeId/versions` → `[ ResumeVersionDto ]`
- `GET /resumes/versions/:versionId/feedbacks` → `[ FeedbackDto ]`
- `GET /resumes/versions/:versionId/download` → `text/plain`
- `POST /resumes/versions/:versionId/process` → `{ ok, newVersionId }` (requires AI)
- `DELETE /resumes/:resumeId` → `{ ok: true }`

## CV Pro (paid)

- `POST /cv/diagnosis` → `{ diagnosis, truncated, tier, upgrade_message? }`
- `POST /cv/job-match` → `{ match, tier }` (Pro-only)
- `POST /cv/rewrite-section` → `{ rewrites, tier }` (Pro-only)

## Billing (to implement)

- `GET /billing/portal` → provider portal URL
- `POST /billing/webhook` → 200 (provider signature validation)

## Admin (to implement)

- `GET /admin/me`
- `GET /admin/users` / `PATCH /admin/users/:id`
- `GET /admin/plans` / `POST /admin/plans` / `PATCH /admin/plans/:id`
- `GET /admin/content` / `PATCH /admin/content/:key` / `POST /admin/content/:key/publish`
- `GET /admin/settings` / `PATCH /admin/settings/:key`
- `GET /admin/audit`
- `GET /admin/analytics`

