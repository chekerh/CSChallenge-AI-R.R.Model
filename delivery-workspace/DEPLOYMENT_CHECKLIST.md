# Deployment checklist

## Prerequisites

- Node.js 18+ (for native `fetch` compatibility on server — **inferred**; lockfiles target modern Node).
- MongoDB reachable from API (Atlas URI or self-hosted).
- OpenAI API key with access to configured model (`OPENAI_MODEL`, default `gpt-4o-mini`).

## Build

```bash
npm install
npm run build
```

Artifacts:

- `frontend/dist/` — static assets (serve via CDN, S3+CloudFront, Netlify, Vercel static, etc.).
- `server/dist/` — compile output; run with `node dist/index.js` from `server/` (or copy dist + package.json to image).

## Environment variables

### Server (`server/.env` or platform secret manager)

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | e.g. `mongodb+srv://...` |
| `JWT_SECRET` | Yes (prod) | Min 16 chars; enforced at runtime in production |
| `OPENAI_API_KEY` | Yes (for AI) | |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `PORT` | No | Default `4000` |
| `HOST` | No | Default `0.0.0.0` |
| `NODE_ENV` | Yes (prod) | Set `production` |
| `CORS_ORIGIN` | Recommended | Comma-separated allowed origins (e.g. `https://app.example.com`) |
| `KAGGLE_USERNAME` / `KAGGLE_KEY` | No | For `/kaggle/datasets` |

### Frontend (build-time)

| Variable | Notes |
|----------|--------|
| `VITE_API_URL` | Public API base URL, no trailing slash |

Copy from `server/.env.example` and `frontend/.env.example`.

## Secrets handling

- Never commit `.env` files.
- Inject secrets via platform (K8s secrets, AWS Secrets Manager, Fly.io secrets, etc.).
- Rotate `JWT_SECRET` invalidates all sessions — plan maintenance window.

## Runtime

- Process manager: systemd, PM2, or container orchestration.
- **Trust proxy**: `app.set('trust proxy', 1)` when `NODE_ENV=production` — configure proxy hops correctly.
- **Uploads**: `server/uploads/` must be writable; for multi-instance deployments use shared storage or switch to object storage (**not implemented**).

## Health & readiness

- Liveness: `GET /health` returns 200 when `db: up`.
- Readiness: same endpoint; fail pod if 503.

## Rollback

- Keep previous container image or `dist/` artifact.
- Revert env var changes (especially `JWT_SECRET`) with care — triggers mass logout.

## Monitoring

- Log aggregation for API errors and OpenAI failures.
- Alert on `/health` 503 rate.
- Track OpenAI usage/cost (dashboard + quotas).

## Post-deploy smoke

1. `GET /health`
2. Signup + login via API or UI
3. Create resume + process (if OpenAI enabled)
