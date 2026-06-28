#!/usr/bin/env bash
# Quick production API diagnostics (run on VPS as root).
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${ROOT}/.env.production"
LOG_DIR="${JD_LOG_DIR:-/var/log/jebdekho}"

cd "$ROOT"

echo "=== jebdekho-api PM2 ==="
pm2 describe jebdekho-api 2>/dev/null | grep -E 'status|restarts|uptime|script path|node args|error log|out log' || echo "PM2 process jebdekho-api not found"

API_PORT=3001
if [[ -f "$ENV_FILE" ]]; then
  API_PORT="$(grep -E '^API_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ' || true)"
  API_PORT="${API_PORT:-3001}"
fi

echo ""
echo "=== API_PORT from .env.production: ${API_PORT} (nginx expects 3001) ==="
if [[ "$API_PORT" != "3001" ]]; then
  echo "WARN: nginx upstream is 127.0.0.1:3001 — set API_PORT=3001 or update nginx"
fi

echo ""
echo "=== Listening on :${API_PORT}? ==="
if command -v ss >/dev/null 2>&1; then
  ss -tlnp | grep ":${API_PORT}" || echo "NOT LISTENING on port ${API_PORT}"
else
  netstat -tlnp 2>/dev/null | grep ":${API_PORT}" || echo "NOT LISTENING on port ${API_PORT}"
fi

echo ""
echo "=== curl http://127.0.0.1:${API_PORT}/health ==="
LOCAL_HEALTH=$(curl -sS -w "\nHTTP %{http_code}" "http://127.0.0.1:${API_PORT}/health" 2>&1 || true)
echo "$LOCAL_HEALTH"

echo ""
echo "=== curl https://api.jebdekho.com/health (via nginx) ==="
PUBLIC_HEALTH=$(curl -sS -w "\nHTTP %{http_code}" "https://api.jebdekho.com/health" 2>&1 || true)
echo "$PUBLIC_HEALTH"

echo ""
echo "=== PM2 logs (last 40 lines) ==="
pm2 logs jebdekho-api --lines 40 --nostream 2>/dev/null || true

echo ""
echo "=== ${LOG_DIR}/api-error.log (last 30 lines) ==="
if [[ -f "${LOG_DIR}/api-error.log" ]]; then
  tail -30 "${LOG_DIR}/api-error.log"
else
  echo "(no file at ${LOG_DIR}/api-error.log)"
fi

echo ""
echo "=== Boot test (capture startup error, 12s max) ==="
if [[ ! -f "${ROOT}/apps/api/dist/main.js" ]]; then
  echo "ERROR: apps/api/dist/main.js missing — run: pnpm --filter @jebdekho/api build"
else
  set +e
  timeout 12 node "--env-file=${ENV_FILE}" "${ROOT}/apps/api/dist/main.js" 2>&1 | tail -40
  BOOT_EXIT=$?
  set -e
  if [[ "$BOOT_EXIT" == "124" ]]; then
    echo "(boot test timed out — API likely started; check port ${API_PORT})"
  fi
fi

echo ""
echo "=== .env syntax hints (Shadowfax / secrets) ==="
if [[ -f "$ENV_FILE" ]]; then
  for key in SHADOWFAX_PRODUCTION_TOKEN SHADOWFAX_WEBHOOK_SECRET JWT_PRIVATE_KEY; do
    if grep -qE "^${key}=" "$ENV_FILE"; then
      line=$(grep -E "^${key}=" "$ENV_FILE" | tail -1)
      if [[ "$line" == *" #"* ]] && [[ "$key" != JWT_PRIVATE_KEY ]]; then
        echo "WARN: ${key} line contains ' #' — text after # is ignored; wrap value in double quotes"
      fi
      if [[ "$line" =~ ^${key}=$ ]]; then
        echo "WARN: ${key} is empty"
      fi
    fi
  done
fi

echo ""
echo "=== Suggested fixes ==="
echo "1. pm2 logs jebdekho-api --lines 100   # read the actual crash reason"
echo "2. Ensure API_PORT=3001 in .env.production"
echo "3. Quote secrets: SHADOWFAX_WEBHOOK_SECRET=\"your-secret\""
echo "4. pm2 delete deploy/ecosystem.config.js; pm2 start deploy/ecosystem.config.js"
echo "5. curl http://127.0.0.1:3001/health  # must work before nginx/Shadowfax"
