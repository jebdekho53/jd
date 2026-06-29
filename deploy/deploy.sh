#!/usr/bin/env bash
# JebDekho production deployment script
set -euo pipefail

APP_DIR="${JD_APP_DIR:-/var/www/jebdekho}"
BRANCH="${JD_BRANCH:-main}"
LOG_FILE="${JD_DEPLOY_LOG:-/var/log/jebdekho/deploy.log}"
ROLLBACK_MARKER="${APP_DIR}/.deploy-prev-sha"

mkdir -p "$(dirname "$LOG_FILE")" /var/log/jebdekho "${APP_DIR}/uploads"

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"; }

cd "$APP_DIR"

log "=== Deploy started ==="

git rev-parse HEAD > "$ROLLBACK_MARKER"
PREV_SHA=$(cat "$ROLLBACK_MARKER")
log "Previous SHA: $PREV_SHA"

log "Pulling $BRANCH..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

log "Installing dependencies..."
corepack enable
# Keep devDependencies (prisma CLI, turbo, typescript) even if the shell exported NODE_ENV=production.
(
  unset NODE_ENV
  export CI=true
  pnpm install --frozen-lockfile --prod=false
)

if [[ ! -f .env.production ]]; then
  log "ERROR: .env.production not found at $APP_DIR/.env.production"
  exit 1
fi

log "Running database migrations..."
./deploy/scripts/db-migrate.sh

log "Seeding platform roles (idempotent)..."
(
  unset NODE_ENV
  pnpm db:seed:platform
)

log "Seeding master location directory (idempotent)..."
(
  unset NODE_ENV
  pnpm db:seed:locations
)

log "Building production apps..."
chmod +x deploy/scripts/build-production.sh
./deploy/scripts/build-production.sh

log "Restarting PM2 processes (graceful reload — avoid pm2 delete downtime)..."
ln -sf .env.production .env
chmod +x deploy/scripts/verify-production-env.sh
./deploy/scripts/verify-production-env.sh

API_PORT_VAL=$(grep -E '^API_PORT=' .env.production | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ' || echo 3001)

if pm2 describe jebdekho-api >/dev/null 2>&1; then
  log "Reloading API first (minimal buyer-facing downtime)..."
  pm2 reload jebdekho-api --update-env
else
  log "First deploy — starting PM2 ecosystem..."
  pm2 start deploy/ecosystem.config.js --only jebdekho-api
fi

log "Waiting for API to listen..."
API_HEALTH_OK=false
for attempt in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${API_PORT_VAL}/health" > /dev/null; then
    API_HEALTH_OK=true
    log "API health OK (attempt $attempt)"
    break
  fi
  sleep 2
done

if [[ "$API_HEALTH_OK" == "true" ]] && pm2 describe jebdekho-api >/dev/null 2>&1; then
  log "Reloading web portals..."
  for portal in jebdekho-buyer-web jebdekho-merchant-web jebdekho-admin-web jebdekho-rider-web jebdekho-vendor-web jebdekho-franchise-web; do
    if pm2 describe "$portal" >/dev/null 2>&1; then
      pm2 reload "$portal" --update-env || log "WARN: reload failed for $portal"
    else
      pm2 start deploy/ecosystem.config.js --only "$portal" || log "WARN: start failed for $portal"
    fi
  done
elif [[ "$API_HEALTH_OK" != "true" ]]; then
  :
else
  pm2 start deploy/ecosystem.config.js
fi

pm2 save

if [[ "$API_HEALTH_OK" != "true" ]]; then
  log "ERROR: API health check failed on port ${API_PORT_VAL}"
  pm2 status || true
  pm2 logs jebdekho-api --lines 40 --nostream 2>/dev/null || true
  if [[ -f /var/log/jebdekho/api-error.log ]]; then
    log "--- api-error.log (last 40 lines) ---"
    tail -40 /var/log/jebdekho/api-error.log | tee -a "$LOG_FILE"
  fi
  log "Run deploy/rollback.sh to revert, or fix .env.production and pm2 restart deploy/ecosystem.config.js"
  exit 1
fi

for port in 3000 3002 3003 3004 3005 3006; do
  if ! curl -fsS -o /dev/null "http://127.0.0.1:${port}"; then
    log "WARN: Portal on port $port did not respond (may still be starting)"
  fi
done

if [[ -x ./deploy/scripts/smoke-next-portals.sh ]]; then
  log "Smoke: Next.js static assets..."
  ./deploy/scripts/smoke-next-portals.sh | tee -a "$LOG_FILE" || {
    log "ERROR: Next.js static asset mismatch — admin/buyer chunks may 400 until rebuild+reload"
    exit 1
  }
fi

BUYER_JS_FILE=$(find apps/buyer-web/.next/static/chunks -type f -name '*.js' | head -1 || true)
if [[ -n "$BUYER_JS_FILE" ]]; then
  BUYER_JS_PATH="/_next/static/${BUYER_JS_FILE#apps/buyer-web/.next/static/}"
  BUYER_JS_HEADERS=$(curl -sSI "https://jebdekho.com${BUYER_JS_PATH}" 2>/dev/null || true)
  BUYER_JS_CODE=$(printf '%s\n' "$BUYER_JS_HEADERS" | awk 'toupper($0) ~ /^HTTP\// { code=$2 } END { print code }')
  BUYER_JS_TYPE=$(printf '%s\n' "$BUYER_JS_HEADERS" | awk 'BEGIN{IGNORECASE=1} /^content-type:/ { print $2; exit }' | tr -d '\r')
  log "Post-deploy buyer JS probe: path=${BUYER_JS_PATH} code=${BUYER_JS_CODE:-000} type=${BUYER_JS_TYPE:-unknown}"
  if [[ "${BUYER_JS_CODE:-000}" != "200" || ! "${BUYER_JS_TYPE:-}" =~ ^(application|text)/javascript ]]; then
    log "ERROR: buyer _next/static JS probe failed — check nginx alias/MIME and PM2 build"
    exit 1
  fi
fi

PUBLIC_CATS_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -H "Origin: https://jebdekho.com" \
  "https://api.jebdekho.com/api/v1/buyer/categories" 2>/dev/null || echo "000")
PUBLIC_HEALTH_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "https://api.jebdekho.com/health" 2>/dev/null || echo "000")
log "Post-deploy public probes: categories=${PUBLIC_CATS_CODE} health=${PUBLIC_HEALTH_CODE}"
if [[ "$PUBLIC_CATS_CODE" != "200" ]]; then
  log "WARN: Public categories probe not 200 — check nginx upstream and pm2 logs"
fi

log "=== Deploy complete ==="
log "New SHA: $(git rev-parse HEAD)"
