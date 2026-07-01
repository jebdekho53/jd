#!/usr/bin/env bash
# Safe Shadowfax forward API probe. Loads production env and checks serviceability only.
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${ROOT}/.env.production"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

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

mode="${SHADOWFAX_API_MODE:-v3_marketplace}"
case "$mode" in
  ""|"v3"|"marketplace"|"ecommerce") mode="v3_marketplace" ;;
  "warehouse") mode="v3_warehouse" ;;
  "hyperlocal"|"hl") mode="flash" ;;
esac

base="${SHADOWFAX_API_URL:-}"
base="${base%/}"
if [[ "$mode" == "flash" ]]; then
  base="${base%/api/v3}"
  base="${base%/api}"
  serviceability_path="/order/serviceability/"
  create_path="/order/create/"
  serviceability_method="POST"
else
  base="${base%/api/api}"
  base="${base%/api/v3}"
  base="${base%/v3}"
  base="${base%/api}"
  base="${base}/api"
  serviceability_path="/v1/clients/serviceability/"
  serviceability_method="GET"
  if [[ "$mode" == "v3_warehouse" ]]; then
    create_path="/v3/clients/shipments/"
  else
    create_path="/v3/clients/orders/"
  fi
fi

if [[ -z "${SHADOWFAX_API_URL:-}" ]]; then
  echo "ERROR: SHADOWFAX_API_URL is not set"
  exit 1
fi

token="${SHADOWFAX_PRODUCTION_TOKEN:-${SHADOWFAX_TEST_TOKEN:-}}"
if [[ -z "$token" ]]; then
  echo "ERROR: SHADOWFAX_PRODUCTION_TOKEN or SHADOWFAX_TEST_TOKEN is not set"
  exit 1
fi
if [[ "$token" =~ ^[Tt]oken([[:space:]]|$) ]] || [[ "$token" =~ ^[Bb]earer([[:space:]]|$) ]]; then
  echo "ERROR: token env must contain the raw token only, without 'Token ' or 'Bearer ' prefix"
  exit 1
fi
if [[ "$token" =~ [[:space:]] ]]; then
  echo "ERROR: token env must not contain whitespace"
  exit 1
fi

serviceability_pincodes="${SHADOWFAX_SERVICEABILITY_PINCODE:-${SHADOWFAX_TEST_DROPOFF_PINCODE:-560016}}"
if [[ "$serviceability_method" == "GET" ]]; then
  url="${base}${serviceability_path}?service=customer_delivery&page=1&count=10&pincodes=${serviceability_pincodes}"
else
  url="${base}${serviceability_path}"
fi
create_url="${base}${create_path}"
payload="$(cat <<JSON
{
  "pickup_lat": ${SHADOWFAX_TEST_PICKUP_LAT:-28.6139},
  "pickup_lng": ${SHADOWFAX_TEST_PICKUP_LNG:-77.2090},
  "drop_lat": ${SHADOWFAX_TEST_DROPOFF_LAT:-28.6200},
  "drop_lng": ${SHADOWFAX_TEST_DROPOFF_LNG:-77.2200},
  "weight_g": ${SHADOWFAX_TEST_WEIGHT_G:-500}
}
JSON
)"

echo "=== Shadowfax Forward API probe ==="
echo "SHADOWFAX_API_URL=${SHADOWFAX_API_URL}"
echo "Resolved base=${base}"
echo "Resolved mode=${mode}"
echo "Resolved serviceability endpoint=${serviceability_path}"
echo "Resolved create order endpoint=${create_path}"
echo "Resolved create order URL=${create_url}"
echo "Token present=yes token=$(mask "$token")"
echo ""
echo "${serviceability_method} ${url}"
if [[ "$serviceability_method" == "POST" ]]; then
  echo "Request body:"
  echo "$payload"
fi
echo ""

tmp_body="$(mktemp)"
if [[ "$serviceability_method" == "GET" ]]; then
  status="$(
    curl -sS -o "$tmp_body" -w "%{http_code}" \
      -X GET "$url" \
      -H "Authorization: Token ${token}" \
      -H "Content-Type: application/json" || true
  )"
else
  status="$(
    curl -sS -o "$tmp_body" -w "%{http_code}" \
      -X POST "$url" \
      -H "Authorization: Token ${token}" \
      -H "Content-Type: application/json" \
      -d "$payload" || true
  )"
fi

echo "HTTP ${status}"
echo "Response body:"
head -c 4000 "$tmp_body"
echo ""
rm -f "$tmp_body"

if [[ "$status" -ge 200 && "$status" -lt 300 ]]; then
  echo "OK: serviceability endpoint is reachable"
else
  echo "FAIL: serviceability endpoint returned HTTP ${status}"
  exit 1
fi
