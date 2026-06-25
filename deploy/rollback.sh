#!/usr/bin/env bash
# Rollback to previous deployment commit
set -euo pipefail

APP_DIR="${JD_APP_DIR:-/var/www/jebdekho}"
ROLLBACK_MARKER="${APP_DIR}/.deploy-prev-sha"

if [[ ! -f "$ROLLBACK_MARKER" ]]; then
  echo "No rollback marker found at $ROLLBACK_MARKER"
  exit 1
fi

PREV_SHA=$(cat "$ROLLBACK_MARKER")
echo "Rolling back to $PREV_SHA..."

cd "$APP_DIR"
git checkout "$PREV_SHA"

corepack enable
(
  unset NODE_ENV
  export CI=true
  pnpm install --frozen-lockfile --prod=false
)

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

./deploy/scripts/build-production.sh
pm2 reload deploy/ecosystem.config.js --update-env
pm2 save

echo "Rollback complete. Verify: curl http://127.0.0.1:${API_PORT:-3001}/health"
