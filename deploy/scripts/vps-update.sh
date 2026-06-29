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

if [[ -x ./deploy/scripts/smoke-next-portals.sh ]]; then
  echo "==> Smoke Next.js static assets"
  ./deploy/scripts/smoke-next-portals.sh
fi

BUYER_JS_FILE=$(find apps/buyer-web/.next/static/chunks -type f -name '*.js' | head -1 || true)
if [[ -n "$BUYER_JS_FILE" ]]; then
  BUYER_JS_PATH="/_next/static/${BUYER_JS_FILE#apps/buyer-web/.next/static/}"
  BUYER_JS_HEADERS=$(curl -sSI "https://jebdekho.com${BUYER_JS_PATH}" 2>/dev/null || true)
  BUYER_JS_CODE=$(printf '%s\n' "$BUYER_JS_HEADERS" | awk 'toupper($0) ~ /^HTTP\// { code=$2 } END { print code }')
  BUYER_JS_TYPE=$(printf '%s\n' "$BUYER_JS_HEADERS" | awk 'BEGIN{IGNORECASE=1} /^content-type:/ { print $2; exit }' | tr -d '\r')
  echo "==> Buyer JS probe: ${BUYER_JS_PATH} code=${BUYER_JS_CODE:-000} type=${BUYER_JS_TYPE:-unknown}"
  if [[ "${BUYER_JS_CODE:-000}" != "200" || ! "${BUYER_JS_TYPE:-}" =~ ^(application|text)/javascript ]]; then
    echo "ERROR: buyer _next/static JS probe failed"
    exit 1
  fi
fi

echo "==> Done. Verify: curl http://127.0.0.1:\${API_PORT:-3001}/health"
