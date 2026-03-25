# Run guide — full stack UtopiaHire

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 5, React 18, TypeScript, Tailwind |
| Backend | Express, Mongoose 7, MongoDB |
| Shared | TypeScript package `@utopiahire/shared` |
| AI | OpenAI (optional for local dev; required for CV/resume AI features) |

## Prerequisites

- **Node.js** 18+
- **MongoDB** reachable (default `mongodb://localhost:27017/utopiahire`)
- **npm** at repo root (workspaces)

## Environment

### Server (`server/.env`)

Copy from `server/.env.example`:

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGODB_URI` | Yes | e.g. `mongodb://127.0.0.1:27017/utopiahire` |
| `JWT_SECRET` | Dev: optional (weak default) | **Min 16 chars in production** |
| `OPENAI_API_KEY` | For AI features | Empty → `503` / “AI service not configured” on process & `/cv/*` |
| `PORT` | No | Default `4000` |
| `HOST` | No | Default `0.0.0.0` |
| `CORS_ORIGIN` | Prod | Comma-separated origins |

### Frontend

- `frontend/.env` or env at dev time: `VITE_API_URL=http://127.0.0.1:4000` (no trailing slash)
- **Must match** the port the API actually listens on.

## Install

```bash
cd /path/to/UtopiaHire
npm install
```

## Database

```bash
cd server
npm run migrate
```

## Development startup

**Option A — both (root):**

```bash
npm run dev
```

**Option B — separate terminals:**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

Default URLs: API `http://127.0.0.1:4000`, UI `http://127.0.0.1:5173`.

## Port conflicts

If something else binds to `4000`, start the API on another port:

```bash
cd server && PORT=4011 npm run dev
```

Then run the frontend with:

```bash
cd frontend && VITE_API_URL=http://127.0.0.1:4011 npm run dev
```

## Health check

```bash
curl -s http://127.0.0.1:4000/health
# expect: {"ok":true,"db":"up"} when Mongo is connected
```

## Smoke test (API)

From `server/`:

```bash
BASE=http://127.0.0.1:4011 npm run smoke
```

Use the same host/port as your running API. Default in script is `http://127.0.0.1:4000`.

## Production build

```bash
npm run build
cd server && npm start   # serves dist/index.js; set NODE_ENV=production
```

Serve `frontend/dist` with a static host or integrate per your deployment.

## Platform notes

- **macOS / Linux:** commands above as-is.
- **Windows:** use PowerShell; `cross-env` optional for `PORT=4011` inline env.

## QA session (2025-03-25)

- MongoDB on `127.0.0.1:27017` was **available**.
- Port `4000` was occupied by a **non–UtopiaHire** service; validation used **4011** + `VITE_API_URL` override.
