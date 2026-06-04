#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "[1/5] Installing dependencies..."
npm install

echo "[2/5] Applying database migrations..."
npx prisma migrate deploy

echo "[3/5] Building application..."
npm run build

echo "[4/5] Starting/reloading PM2 process..."
if pm2 describe multitrip-site >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production
else
  pm2 start ecosystem.config.cjs --env production
fi

echo "[5/5] Saving PM2 process list..."
pm2 save

echo "Production deploy complete."
