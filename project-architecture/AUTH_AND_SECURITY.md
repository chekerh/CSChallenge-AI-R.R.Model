# Auth and security

## Mechanism

- **JWT** in `Authorization: Bearer <token>` header.
- Signed with `JWT_SECRET` via `jsonwebtoken` (`server/src/auth.ts`, `middleware/authMiddleware.ts`).
- **Production rule**: `getJwtSecret()` in `server/src/config/env.ts` requires a secret of length ≥ 16.

## Session / token handling

- Client stores token in `localStorage` (`frontend/src/contexts/AuthContext.tsx`, `AuthForm.tsx`).
- No refresh token or server-side session store (**limitation**: stolen token valid until expiry — 7 days).

## Roles / permissions

- Single role. Authorization is **resource ownership** via Mongo `Resume.user_id` matching JWT `id`.

## Sensitive flows

- Resume text may contain PII — protect with TLS, access control, and secure DB backups.
- OpenAI submission sends full resume text to third party — document in privacy policy.

## Validation / sanitization

- Signup: email format, password length, duplicate check.
- Upload: size + extension filter; parsing uses `pdf-parse` / `mammoth`.

## Rate limiting / middleware

- `express-rate-limit` on `/auth` and API routers (`server/src/index.ts`).
- `helmet` enabled; CORS from `CORS_ORIGIN` or permissive in dev.

## Weak spots (residual)

- No account lockout on brute force (rate limit only).
- No email verification.
- Local upload directory not encrypted at rest by application.
- Passport Google OAuth packages present but unused — reduces clarity.

## Recommendations

- Add refresh tokens or shorter JWT TTL + silent re-auth UX.
- Remove unused OAuth/Supabase deps or implement fully.
- Centralized audit log for auth and AI calls (optional).
