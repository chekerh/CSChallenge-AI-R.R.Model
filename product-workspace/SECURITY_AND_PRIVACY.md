# Security and privacy

## Threat model (summary)

The app processes highly sensitive user data (resume text contains PII). Main threats:

- Unauthorized access to resumes (broken auth/ownership checks)
- Token theft (localStorage risks)
- Admin abuse (insufficient RBAC/auditing)
- Upload attacks (malicious files, path traversal)
- AI data leakage (sending PII to OpenAI)
- Billing fraud / webhook spoofing

## Authentication

- Email/password with bcrypt hashing.
- JWT bearer tokens.
- Production:
  - strong `JWT_SECRET`
  - shorter token TTL + refresh flow (recommended)
  - rate limiting + optional lockout

## Authorization

- Resource ownership checks on resumes/versions.
- Admin routes protected by RBAC middleware.
- Support role gets least privilege.

## Upload security

- Enforce size limits and allowed mime types.
- Store uploads outside repo; avoid serving raw uploads directly.
- Virus scan (future) for larger scale.

## AI / third-party data handling

- Explicitly disclose OpenAI as a processor in privacy policy.
- Allow users to opt out of AI processing (still can store resume for classic mode).
- Avoid logging raw resume text; redact in error logs.

## Secrets management

- Never commit `.env` files; only `.env.example`.
- Use environment variables in deployment (managed secret store).

## Admin security hardening

- Require admin MFA (phase 2).
- Audit all admin writes.
- Optional IP allowlist for admin.
- Prevent role escalation except super_admin.

## Logging and observability

- Log request ids and error codes.
- Avoid PII in logs by default; allow temporary debug mode with explicit toggle and short retention.

