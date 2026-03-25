# Run guide (validated steps)

## Dependencies

- **Node.js** 18+ (workspace uses modern tooling).
- **npm** (workspaces at repo root).
- **MongoDB** listening on `127.0.0.1:27017` (or set `MONGODB_URI`).

## One-time setup

```bash
cd /path/to/UtopiaHire
npm install
cp server/.env.example server/.env
# Edit server/.env: set OPENAI_API_KEY if you want AI processing
cd server && npx ts-node src/migrate.ts && cd ..
```

## Environment variables

### Server (`server/.env`)

| Variable | Required for | Notes |
|----------|----------------|-------|
| `MONGODB_URI` | API + migrate | Default in example: `mongodb://localhost:27017/utopiahire` |
| `JWT_SECRET` | Auth | ≥16 chars in production; example file is dev-safe |
| `OPENAI_API_KEY` | AI process | Omit → API returns “AI service not configured” |
| `PORT` | Bind | Default `4000` |
| `HOST` | Bind | Default `0.0.0.0` |

### Frontend (dev)

- **`VITE_API_URL`** — must match API origin (e.g. `http://127.0.0.1:4020` if API not on 4000).
- Optional: `frontend/.env` or `frontend/.env.local` with `VITE_API_URL=...`.

Example when port 4000 is taken:

```bash
# Terminal A
cd server && PORT=4020 npm run dev

# Terminal B
cd frontend && VITE_API_URL=http://127.0.0.1:4020 npm run dev -- --host 127.0.0.1 --port 5173
```

Or from root (both default ports — only if 4000 is free):

```bash
npm run dev
```

## Platform caveats

- **macOS**: `lsof -i :4000` to see what holds the port; free it or use another `PORT`.
- **`ts-node-dev`**: `server` dev script includes `--exit-child` so restarts release the listen port (added during this validation).
- **Windows**: use `netstat` / PowerShell equivalents; paths use `copy` instead of `cp`.

## Smoke test

```bash
cd server
BASE=http://127.0.0.1:4020 npm run smoke
```

Expect: token + `created resume`; `process` may error if `OPENAI_API_KEY` unset.

## Production-style run

```bash
npm run build
cd server && node dist/index.js
# Serve frontend/dist via static host or `vite preview`
```
