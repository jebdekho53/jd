#!/usr/bin/env bash
# Quick production API diagnostics (run on VPS as root).
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${ROOT}/.env.production"
LOG_DIR="${JD_LOG_DIR:-/var/log/jebdekho}"

cd "$ROOT"

echo "=== git deployment ==="
git rev-parse HEAD 2>/dev/null || echo "(not a git repo)"
git status --short 2>/dev/null | head -5 || true

echo ""
echo "=== Prisma client (order-claim types) ==="
if (
  cd "${ROOT}/apps/api"
  node -e "
    try {
      const c = require('@prisma/client');
      if (!c.OrderClaimStatus) {
        console.log('WARN: @prisma/client is stale — run: pnpm db:generate (then rebuild API)');
        process.exit(0);
      }
      console.log('OK: OrderClaimStatus enum present in Prisma client');
    } catch (e) {
      console.log('WARN: cannot load @prisma/client:', e.message);
    }
  "
); then
  :
fi

echo ""
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
echo "=== PM2 restart count (high restarts => crash loop / OOM) ==="
pm2 jlist 2>/dev/null | node -e "
const fs=require('fs');
let s='';
process.stdin.on('data',d=>s+=d);
process.stdin.on('end',()=>{
  try {
    const apps=JSON.parse(s);
    for (const a of apps) {
      if (a.name==='jebdekho-api') {
        console.log('restarts:', a.pm2_env?.restart_time ?? '?');
        console.log('unstable_restarts:', a.pm2_env?.unstable_restarts ?? '?');
        console.log('exit_code:', a.pm2_env?.exit_code ?? '?');
        console.log('status:', a.pm2_env?.status ?? '?');
      }
    }
  } catch { console.log('(could not parse pm2 jlist)'); }
});
" 2>/dev/null || true

echo ""
echo "=== curl http://127.0.0.1:${API_PORT}/health/uptime ==="
UPTIME_OUT=$(curl -sS -w "\nHTTP %{http_code}" "http://127.0.0.1:${API_PORT}/health/uptime" 2>&1 || true)
echo "$UPTIME_OUT"
if echo "$UPTIME_OUT" | grep -q "HTTP 404"; then
  echo "WARN: /health/uptime missing — run: pnpm --filter @jebdekho/api build && pm2 reload jebdekho-api --update-env"
fi

if [[ -f "${ROOT}/apps/api/dist/health/health.controller.js" ]]; then
  if grep -q "uptime" "${ROOT}/apps/api/dist/health/health.controller.js"; then
    echo "dist: health/uptime route present in build"
  else
    echo "WARN: dist build is stale — missing uptime route in health.controller.js"
  fi
else
  echo "WARN: apps/api/dist/health/health.controller.js missing — rebuild API"
fi

echo ""
echo "=== curl https://api.jebdekho.com/health (via nginx) ==="
PUBLIC_HEALTH=$(curl -sS -w "\nHTTP %{http_code}" "https://api.jebdekho.com/health" 2>&1 || true)
echo "$PUBLIC_HEALTH"

echo ""
echo "=== curl https://api.jebdekho.com/api/v1/buyer/categories (public) ==="
curl -sS -w "\nHTTP %{http_code}\n" -H "Origin: https://jebdekho.com" \
  "https://api.jebdekho.com/api/v1/buyer/categories" 2>&1 | tail -5

echo ""
echo "=== nginx error.log — upstream / 502 (last 40 matching lines) ==="
if [[ -r /var/log/nginx/error.log ]]; then
  grep -E 'upstream|502|connect\(\) failed|timed out' /var/log/nginx/error.log | tail -40 || echo "(no matching lines)"
else
  echo "(run as root to read /var/log/nginx/error.log)"
fi

echo ""
echo "=== nginx -t ==="
sudo nginx -t 2>&1 || nginx -t 2>&1 || echo "(nginx -t not available)"

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
echo "=== Boot test (skipped when API already listening on :${API_PORT}) ==="
if ss -tlnp 2>/dev/null | grep -q ":${API_PORT}" || netstat -tlnp 2>/dev/null | grep -q ":${API_PORT}"; then
  echo "SKIP: port ${API_PORT} in use (PM2 likely running). Use pm2 reload + /health checks instead."
elif [[ ! -f "${ROOT}/apps/api/dist/main.js" ]]; then
  echo "ERROR: apps/api/dist/main.js missing — run: pnpm --filter @jebdekho/api build"
else
  set +e
  timeout 12 node "--env-file=${ENV_FILE}" "${ROOT}/apps/api/dist/main.js" 2>&1 | tail -40
  BOOT_EXIT=$?
  set -e
  if [[ "$BOOT_EXIT" == "124" ]]; then
    echo "(boot test timed out — API likely started)"
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
echo "4. ./deploy/scripts/build-api.sh   # generate + migrate + build (never build API alone)"
echo "5. pm2 reload jebdekho-api --update-env   # only after build succeeds"
echo "6. curl http://127.0.0.1:3001/health  # must work before nginx/Shadowfax"
