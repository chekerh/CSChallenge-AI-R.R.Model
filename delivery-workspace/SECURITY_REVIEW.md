# Security review

## Authentication

| Topic | Before | After |
|-------|--------|--------|
| JWT secret | Hardcoded fallback `devsecret` in code paths | `getJwtSecret()` — dev fallback only when not production; production requires ≥16 chars |
| Token transport | Bearer header | Unchanged; **ensure HTTPS in production** |
| Password storage | bcrypt rounds 10 | Unchanged; acceptable baseline |
| Signup | Upsert could overwrite existing account | Create-only; 409 on duplicate email |

## Authorization

| Route group | Issue | Mitigation |
|-------------|-------|------------|
| Resume versions / process / feedback / download | IDOR, anonymous OpenAI use | `requireAuth` + `assertResumeOwner` / `assertVersionOwner` |
| Kaggle proxy | Public if credentials set | `requireAuth` on `/kaggle/datasets` |

## Validation / sanitization

- Email: normalized to lowercase; regex sanity check on signup.
- Password: minimum length 8 on signup (**inferred**: consider strength meter / breach list in future).
- ObjectId params: validated with `Types.ObjectId.isValid` where added.
- Upload: extension allowlist + size cap; content still parsed — **residual risk**: malicious PDF parsing; keep `pdf-parse` updated.

## API protection

- `helmet` for standard HTTP headers.
- `express-rate-limit` on `/auth` and main API routers (tune per deployment).
- JSON body limit `1mb` on Express (excluding multipart uploads handled by multer).

## Error responses

- Avoid returning raw `String(err)` to clients on Kaggle path (changed to generic message).
- OpenAI configuration errors mapped to 503 without leaking key material.

## Secrets

- `.env.example` documents variables; real secrets not in repo.
- **Verify**: no API keys in `edge/*.ts` if committed samples exist.

## Headers / CORS

- `CORS_ORIGIN` should be explicit in production (warning logged if permissive).

## Recommendations not yet implemented

- Refresh tokens / shorter access token TTL.
- CSRF: less critical for pure Bearer SPA; document if adding cookies.
- Content Security Policy tuning when frontend host is known.
- WAF / bot protection at edge.
- Dependency audit remediation (`npm audit`).
