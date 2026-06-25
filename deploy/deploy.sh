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

log "Building production apps..."
chmod +x deploy/scripts/build-production.sh
./deploy/scripts/build-production.sh

log "Restarting PM2 processes..."
ln -sf .env.production .env
chmod +x deploy/scripts/verify-production-env.sh
./deploy/scripts/verify-production-env.sh
pm2 delete deploy/ecosystem.config.js 2>/dev/null || true
pm2 start deploy/ecosystem.config.js
pm2 save

log "Health checks..."
API_PORT_VAL=$(grep -E '^API_PORT=' .env.production | cut -d= -f2- | tr -d '"' | tr -d "'" || echo 3001)
API_HEALTH_OK=false
for attempt in $(seq 1 24); do
  if curl -fsS "http://127.0.0.1:${API_PORT_VAL}/health" > /dev/null; then
    API_HEALTH_OK=true
    log "API health OK (attempt $attempt)"
    break
  fi
  sleep 5
done

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

log "=== Deploy complete ==="
log "New SHA: $(git rev-parse HEAD)"
