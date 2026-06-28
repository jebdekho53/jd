#!/usr/bin/env bash
# Production smoke: Google Maps + Shadowfax env, webhook simulation, optional test order.
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${ROOT}/.env.production"
# shellcheck source=lib/resolve-api-url.sh
source "${ROOT}/deploy/scripts/lib/resolve-api-url.sh"
BUYER_URL="${BUYER_URL:-http://localhost:3000}"
FAIL=0

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

API_V1_URL="$(resolve_api_v1_url "${API_URL:-http://localhost:3001}")"
API_ORIGIN="$(resolve_api_origin "${API_URL:-http://localhost:3001}")"
WEBHOOK_PUSH_URL="${API_V1_URL}/webhooks/shadowfax"

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; FAIL=1; }

echo "=== Google Maps env ==="
if [[ -n "${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-}" ]]; then
  pass "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set"
else
  fail "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing (client maps disabled)"
fi
if [[ -n "${GOOGLE_MAPS_API_KEY:-}" ]] || [[ -n "${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-}" ]]; then
  pass "Server geocoding key available"
else
  fail "GOOGLE_MAPS_API_KEY missing (reverse geocode cache disabled)"
fi

echo ""
echo "=== Shadowfax env ==="
[[ "${DELIVERY_PROVIDER:-shadowfax}" == "shadowfax" ]] && pass "DELIVERY_PROVIDER=shadowfax" || fail "DELIVERY_PROVIDER not shadowfax"
[[ "${ENABLE_SHADOWFAX:-true}" == "true" ]] && pass "ENABLE_SHADOWFAX=true" || fail "ENABLE_SHADOWFAX not true"
[[ "${ENABLE_OWN_FLEET:-false}" == "false" ]] && pass "ENABLE_OWN_FLEET=false" || fail "ENABLE_OWN_FLEET should be false"
[[ -n "${SHADOWFAX_API_URL:-}" ]] && pass "SHADOWFAX_API_URL set" || fail "SHADOWFAX_API_URL missing"
if [[ -n "${SHADOWFAX_PRODUCTION_TOKEN:-}" ]] || [[ -n "${SHADOWFAX_TEST_TOKEN:-}" ]]; then
  pass "Shadowfax token configured"
else
  fail "No SHADOWFAX_PRODUCTION_TOKEN or SHADOWFAX_TEST_TOKEN"
fi
[[ -n "${SHADOWFAX_WEBHOOK_SECRET:-}" ]] && pass "SHADOWFAX_WEBHOOK_SECRET set" || fail "SHADOWFAX_WEBHOOK_SECRET missing"

echo ""
echo "=== API health ==="
if curl -sf "${API_ORIGIN}/health" >/dev/null 2>&1; then
  pass "API reachable at ${API_ORIGIN}/health"
else
  fail "API not reachable at ${API_ORIGIN}/health"
fi

echo ""
echo "=== Shadowfax health check ==="
if [[ -n "${ADMIN_BEARER_TOKEN:-}" ]]; then
  HC=$(curl -sS -X POST "$API_V1_URL/admin/logistics/health-check" \
    -H "Authorization: Bearer $ADMIN_BEARER_TOKEN" \
    -H 'Content-Type: application/json' || true)
  echo "$HC" | head -c 500
  echo ""
  pass "Health check request sent"
else
  echo "SKIP: set ADMIN_BEARER_TOKEN for authenticated health check"
fi

echo ""
echo "=== Webhook simulation ==="
if [[ -n "${SHADOWFAX_WEBHOOK_SECRET:-}" ]]; then
  PAYLOAD='{"event_id":"smoke-'$(date +%s)'","status":"out_for_delivery","data":{"shipment_id":"SMOKE123","status":"out_for_delivery"}}'
  SIG=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$SHADOWFAX_WEBHOOK_SECRET" | awk '{print $2}')
  WH=$(curl -sS -w "\n%{http_code}" -X POST "$WEBHOOK_PUSH_URL" \
    -H "Content-Type: application/json" \
    -H "x-shadowfax-signature: $SIG" \
    -H "Authorization: Token ${SHADOWFAX_WEBHOOK_SECRET}" \
    -d "$PAYLOAD" || echo "000")
  CODE=$(echo "$WH" | tail -1)
  if [[ "$CODE" =~ ^2 ]]; then
    pass "Webhook accepted (HTTP $CODE)"
  else
    fail "Webhook returned HTTP $CODE"
  fi
else
  fail "Cannot simulate webhook without SHADOWFAX_WEBHOOK_SECRET"
fi

echo ""
echo "=== Order tracking verification ==="
if [[ -n "${SMOKE_ORDER_ID:-}" ]] && [[ -n "${BUYER_BEARER_TOKEN:-}" ]]; then
  TRACK=$(curl -sS "$API_V1_URL/buyer/orders/$SMOKE_ORDER_ID/tracking" \
    -H "Authorization: Bearer $BUYER_BEARER_TOKEN" || true)
  if echo "$TRACK" | grep -q '"success":true'; then
    pass "Tracking endpoint returned data for SMOKE_ORDER_ID"
    echo "$TRACK" | head -c 400
    echo ""
  else
    fail "Tracking endpoint failed for SMOKE_ORDER_ID"
  fi
else
  echo "SKIP: set SMOKE_ORDER_ID + BUYER_BEARER_TOKEN to verify tracking"
fi

echo ""
echo "=== Test order (TEST_MODE only) ==="
if [[ "${TEST_MODE:-false}" == "true" ]]; then
  echo "TEST_MODE=true — create a sandbox order via buyer checkout, then re-run with SMOKE_ORDER_ID."
  echo "Buyer web: $BUYER_URL/checkout"
  pass "TEST_MODE hints printed (no prod shipment created by this script)"
else
  echo "Production test order skipped (set TEST_MODE=true to enable sandbox hints)"
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "Smoke checks passed."
  exit 0
else
  echo "Smoke checks failed."
  exit 1
fi
