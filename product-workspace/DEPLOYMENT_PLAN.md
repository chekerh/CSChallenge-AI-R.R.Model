# Deployment plan

## Environments

- **dev**: local Mongo + local servers
- **staging**: managed Mongo, staging OpenAI key, staging billing
- **prod**: managed Mongo, production secrets, production billing

## Hosting

- API: container-based (Fly/Render/GCP/AWS) or Node process (PM2) behind reverse proxy
- Frontend: static hosting (Vercel/Netlify) with env `VITE_API_URL`
- DB: managed MongoDB (Atlas)

## Environment variables (server)

- `MONGODB_URI` (required)
- `JWT_SECRET` (required in production)
- `OPENAI_API_KEY` (required for AI)
- `OPENAI_MODEL` (optional)
- `CORS_ORIGIN` (required in production; restrict)
- `NODE_ENV=production`

## Health checks

- `GET /health` should reflect DB readiness
- Add `/ready` (optional) for deeper checks (AI config, migrations)

## Logging/monitoring

- Structured logs (request id, endpoint, status code)
- Error monitoring (Sentry or similar)
- Metrics dashboard (admin view + infra)

## Rollback strategy

- Keep previous container image versions
- DB migrations must be backwards compatible where possible
- Feature flags for risky releases

## Migrations/indexes

- Maintain a migration script for indexes and critical schema constraints
- Run migrations on deploy as a step with logging

