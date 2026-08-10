#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SERVER_ENV="$ROOT_DIR/server/.env"
MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-devpassword}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m!!\033[0m %s\n' "$*" >&2; }

port_open() {
  local host="$1" port="$2"
  if command -v nc >/dev/null 2>&1; then
    nc -z -w2 "$host" "$port" 2>/dev/null
  else
    node -e "const s=require('net').connect({host:process.argv[1],port:+process.argv[2]},()=>process.exit(0));s.on('error',()=>process.exit(1));s.setTimeout(2000,()=>process.exit(1))" "$host" "$port"
  fi
}

env_set() {
  local file="$1" key="$2" value="$3"
  if grep -qE "^${key}=" "$file"; then
    perl -pi -e "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

log "UtopiaHire startup"

if ! command -v node >/dev/null 2>&1; then
  err "Node.js is not installed or not in PATH."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  err "npm is not installed or not in PATH."
  exit 1
fi
if [[ ! -f package.json ]]; then
  err "package.json not found in $ROOT_DIR"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  log "Installing dependencies (first run)"
  npm install
else
  log "node_modules present, skipping install"
fi

if [[ ! -f shared/dist/index.js ]]; then
  log "Building shared types"
  npm run build:shared
fi

if [[ ! -f "$SERVER_ENV" ]]; then
  log "Creating server/.env from server/.env.example"
  cp server/.env.example "$SERVER_ENV"
fi

JWT_CURRENT="$(grep -E '^JWT_SECRET=' "$SERVER_ENV" | head -1 | cut -d= -f2- || true)"
if [[ -z "$JWT_CURRENT" || "$JWT_CURRENT" == *change_me* ]]; then
  log "Generating a strong JWT_SECRET in server/.env"
  env_set "$SERVER_ENV" JWT_SECRET "$(openssl rand -hex 32)"
fi

if grep -qE '^OPENAI_API_KEY=$' "$SERVER_ENV"; then
  warn "OPENAI_API_KEY is empty in server/.env - CV analysis and LinkedIn AI posts will not work until you set it."
fi

SERVER_PORT="$(grep -E '^PORT=' "$SERVER_ENV" | head -1 | cut -d= -f2- || true)"
SERVER_PORT="${SERVER_PORT:-4000}"

if [[ -f frontend/.env.local ]]; then
  FE_URL="$(grep -E '^VITE_API_URL=' frontend/.env.local | head -1 | cut -d= -f2- || true)"
  if [[ -n "$FE_URL" && "$FE_URL" =~ ^https?://[^/:]+:([0-9]+) ]]; then
    FE_PORT="${BASH_REMATCH[1]}"
    if [[ "$FE_PORT" != "$SERVER_PORT" && "$FE_URL" =~ (localhost|127\.0\.0\.1) ]]; then
      log "Fixing frontend/.env.local: API URL points to port $FE_PORT, server runs on $SERVER_PORT"
      env_set frontend/.env.local VITE_API_URL "http://127.0.0.1:${SERVER_PORT}"
      warn "Frontend change applied - restart 'npm run dev' if the dev server is already running."
    fi
  fi
fi

MONGODB_URI="$(grep -E '^MONGODB_URI=' "$SERVER_ENV" | head -1 | cut -d= -f2- || true)"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/utopiahire}"

MONGO_URI_NOAUTH="${MONGODB_URI#mongodb://}"
if [[ "$MONGO_URI_NOAUTH" == *"@"* ]]; then
  MONGO_URI_NOAUTH="${MONGO_URI_NOAUTH#*@}"
fi
MONGO_HOSTPORT="${MONGO_URI_NOAUTH%%/*}"
MONGO_HOST="${MONGO_HOSTPORT%%:*}"
if [[ "$MONGO_HOSTPORT" != *":"* ]]; then
  MONGO_PORT=27017
else
  MONGO_PORT="${MONGO_HOSTPORT##*:}"
fi

if port_open "$MONGO_HOST" "$MONGO_PORT"; then
  log "MongoDB reachable at ${MONGO_HOST}:${MONGO_PORT}"
else
  log "MongoDB not reachable at ${MONGO_HOST}:${MONGO_PORT} - attempting to start it"
  STARTED_MONGO=0
  if command -v mongod >/dev/null 2>&1 && [[ "$MONGO_HOST" == "127.0.0.1" || "$MONGO_HOST" == "localhost" ]]; then
    if [[ -f /opt/homebrew/etc/mongod.conf ]]; then
      mkdir -p /opt/homebrew/var/log/mongodb 2>/dev/null || true
      log "Starting mongod (Homebrew config) in background"
      nohup mongod --config /opt/homebrew/etc/mongod.conf >/dev/null 2>&1 &
    else
      mkdir -p "$ROOT_DIR/.mongo-data"
      log "Starting mongod in background"
      nohup mongod --dbpath "$ROOT_DIR/.mongo-data" --logpath "$ROOT_DIR/.mongo-data/mongo.log" >/dev/null 2>&1 &
    fi
    STARTED_MONGO=1
  elif command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    log "Starting MongoDB via docker compose (service 'mongodb')"
    docker compose up -d mongodb
    if [[ "$MONGODB_URI" == "mongodb://127.0.0.1:27017/utopiahire" || "$MONGODB_URI" == "mongodb://localhost:27017/utopiahire" ]]; then
      env_set "$SERVER_ENV" MONGODB_URI "mongodb://admin:${MONGO_ROOT_PASSWORD}@127.0.0.1:27017/utopiahire?authSource=admin"
    fi
    STARTED_MONGO=1
  else
    warn "Could not start MongoDB automatically. Start it yourself and re-run, or set MONGODB_URI in server/.env."
  fi
  if [[ "$STARTED_MONGO" == "1" ]]; then
    for _ in $(seq 1 30); do
      port_open "$MONGO_HOST" "$MONGO_PORT" && break
      sleep 1
    done
    if port_open "$MONGO_HOST" "$MONGO_PORT"; then
      log "MongoDB is up"
    else
      warn "MongoDB still not reachable after 30s."
    fi
  fi
fi

if port_open "$MONGO_HOST" "$MONGO_PORT"; then
  log "Seeding dev users (admin + demo)"
  (cd server && node scripts/seedDevUsers.js)
fi

log "Starting frontend + server"
echo "    Frontend: http://localhost:5173"
echo "    Backend:  http://localhost:4000"
echo "    Stop with Ctrl+C"
echo

exec npm run dev
