#!/usr/bin/env bash
# Manual VPS update — safe when NODE_ENV=production is set in the shell.
# Prefer: pnpm deploy:production
set -euo pipefail

cd "${JD_APP_DIR:-/var/www/jebdekho}"

echo "==> Pull latest"
git pull origin main

echo "==> Install (includes devDependencies for turbo/typescript)"
corepack enable
(
  unset NODE_ENV
  export CI=true
  pnpm install --frozen-lockfile --prod=false
)

echo "==> Migrate database"
./deploy/scripts/db-migrate.sh

echo "==> Seed platform roles"
pnpm db:seed:platform

echo "==> Seed master location directory"
pnpm db:seed:locations

echo "==> Build"
./deploy/scripts/build-production.sh

echo "==> Reload PM2 (graceful — no pm2 delete)"
if pm2 describe jebdekho-api >/dev/null 2>&1; then
  pm2 reload jebdekho-api --update-env
  API_PORT="${API_PORT:-3001}"
  for attempt in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  for portal in jebdekho-buyer-web jebdekho-merchant-web jebdekho-admin-web jebdekho-rider-web jebdekho-vendor-web jebdekho-franchise-web; do
    pm2 reload "$portal" --update-env 2>/dev/null || pm2 start deploy/ecosystem.config.js --only "$portal" 2>/dev/null || true
  done
else
  pm2 start deploy/ecosystem.config.js
fi
pm2 save

echo "==> Done. Verify: curl http://127.0.0.1:\${API_PORT:-3001}/health"
