#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR"

echo "==> UtopiaHire startup"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed or not in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH."
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "Error: package.json not found in $ROOT_DIR"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> Installing dependencies (first run)..."
  npm install
fi

echo "==> Starting frontend + server (npm run dev)"
echo "    Frontend: http://localhost:5173"
echo "    Backend:  http://localhost:4000"
echo "    Stop with Ctrl+C"

npm run dev
