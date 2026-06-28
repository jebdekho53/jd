#!/usr/bin/env bash
# Shadowfax sandbox / ops helper — does NOT create production shipments unless TEST_MODE=true
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${ROOT}/.env.production"
# shellcheck source=lib/resolve-api-url.sh
source "${ROOT}/deploy/scripts/lib/resolve-api-url.sh"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

API_V1_URL="$(resolve_api_v1_url "${API_URL:-http://localhost:3001}")"
API_ORIGIN="$(resolve_api_origin "${API_URL:-http://localhost:3001}")"
API_PORT="$(grep -E '^API_PORT=' "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ' || true)"
API_PORT="${API_PORT:-3001}"
WEBHOOK_PUSH_URL="${API_V1_URL}/webhooks/shadowfax"

mask() {
  local v="$1"
  if [[ -z "$v" ]]; then
    echo "(not set)"
    return
  fi
  local len=${#v}
  if (( len <= 8 )); then
    echo "****"
    return
  fi
  echo "${v:0:4}...${v: -4}"
}

echo "=== Shadowfax configuration ==="
echo "DELIVERY_PROVIDER=${DELIVERY_PROVIDER:-shadowfax}"
echo "ENABLE_SHADOWFAX=${ENABLE_SHADOWFAX:-true}"
echo "ENABLE_OWN_FLEET=${ENABLE_OWN_FLEET:-false}"
echo "SHADOWFAX_API_URL=${SHADOWFAX_API_URL:-(not set)}"
echo "SHADOWFAX_API_MODE=${SHADOWFAX_API_MODE:-(auto from host)}"
echo "SHADOWFAX_CREDITS_KEY=$(mask "${SHADOWFAX_CREDITS_KEY:-}")"
echo "SHADOWFAX_PRODUCTION_TOKEN=$(mask "${SHADOWFAX_PRODUCTION_TOKEN:-}")"
echo "SHADOWFAX_TEST_TOKEN=$(mask "${SHADOWFAX_TEST_TOKEN:-}")"
echo "SHADOWFAX_WEBHOOK_SECRET=$(mask "${SHADOWFAX_WEBHOOK_SECRET:-}")"
echo "WEBHOOK_PUSH_URL=$WEBHOOK_PUSH_URL"

if [[ -n "${SHADOWFAX_API_URL:-}" ]]; then
  echo ""
  echo "=== Resolved Shadowfax API paths (host + path only) ==="
  BASE="${SHADOWFAX_API_URL%/}"
  BASE="${BASE%/api/v3}"
  if [[ "${SHADOWFAX_API_URL}" == *flash-api* || "${SHADOWFAX_API_URL}" == *hlbackend* || "${SHADOWFAX_API_MODE:-}" == "flash" ]]; then
    echo "mode: flash (hyperlocal)"
    echo "create: $(node -e "try{console.log(new URL(process.argv[1]).host+'/order/create/')}catch(e){console.log('invalid-url')}" "$BASE")"
  else
    echo "mode: v3 (e-commerce)"
    echo "create: $(node -e "try{console.log(new URL(process.argv[1]).host+'/api/v3/clients/shipments/')}catch(e){console.log('invalid-url')}" "$BASE")"
  fi
  if [[ "${SHADOWFAX_API_URL}" == */api/v3 ]]; then
    echo "WARN: SHADOWFAX_API_URL should be host-only; /api/v3 is appended by the client"
  fi
fi
echo ""

echo "=== Health check (requires admin JWT in ADMIN_BEARER_TOKEN) ==="
if [[ -n "${ADMIN_BEARER_TOKEN:-}" ]]; then
  curl -sS -X POST "$API_V1_URL/admin/logistics/health-check" \
    -H "Authorization: Bearer $ADMIN_BEARER_TOKEN" \
    -H 'Content-Type: application/json' | head -c 2000
  echo ""
else
  echo "SKIP: set ADMIN_BEARER_TOKEN to run authenticated health check"
fi

echo ""
echo "=== Webhook simulation ==="
WEBHOOK_TARGET="$WEBHOOK_PUSH_URL"
if curl -sf "http://127.0.0.1:${API_PORT:-3001}/health" >/dev/null 2>&1; then
  WEBHOOK_TARGET="http://127.0.0.1:${API_PORT:-3001}/api/v1/webhooks/shadowfax"
  echo "(API reachable on localhost — testing $WEBHOOK_TARGET)"
else
  echo "WARN: API not on 127.0.0.1:${API_PORT:-3001} — testing public URL (502 likely if API is down)"
  echo "Run: ./deploy/scripts/diagnose-api.sh"
fi
if [[ -n "${SHADOWFAX_WEBHOOK_SECRET:-}" ]]; then
  PAYLOAD='{"event_id":"test-'$(date +%s)'","status":"assigned","data":{"shipment_id":"TEST123","status":"assigned"}}'
  SIG=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$SHADOWFAX_WEBHOOK_SECRET" | awk '{print $2}')
  echo "POST $WEBHOOK_TARGET"
  echo "Payload: $PAYLOAD"
  echo "Signature: $SIG"
  curl -sS -w "\nHTTP %{http_code}\n" -X POST "$WEBHOOK_TARGET" \
    -H "Content-Type: application/json" \
    -H "x-shadowfax-signature: $SIG" \
    -H "Authorization: Token ${SHADOWFAX_WEBHOOK_SECRET}" \
    -d "$PAYLOAD" || true
  echo ""
else
  echo "SKIP: SHADOWFAX_WEBHOOK_SECRET not set"
fi

if [[ "${TEST_MODE:-false}" == "true" ]]; then
  echo ""
  echo "TEST_MODE=true — sandbox shipment creation would run here (not implemented in script)."
  echo "Use merchant order READY_FOR_PICKUP flow against Shadowfax test credentials."
else
  echo ""
  echo "Production shipment creation skipped (set TEST_MODE=true to enable sandbox hints only)."
fi
