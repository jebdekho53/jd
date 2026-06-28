#!/usr/bin/env bash
# Poll public API during deploy/reload — run in a second terminal while deploy executes.
# Usage: ./deploy/scripts/smoke-api-availability.sh [seconds] [url]
set -uo pipefail

DURATION="${1:-120}"
URL="${2:-https://api.jebdekho.com/api/v1/buyer/categories}"
ORIGIN="${SMOKE_ORIGIN:-https://jebdekho.com}"

ok=0
bad=0
codes=""

end=$((SECONDS + DURATION))
while [[ $SECONDS -lt $end ]]; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" -H "Origin: ${ORIGIN}" "$URL" 2>/dev/null || echo "000")
  codes="${codes}${code} "
  if [[ "$code" == "200" ]]; then
    ok=$((ok + 1))
  else
    bad=$((bad + 1))
    echo "[$(date -Iseconds)] FAIL http=${code}"
  fi
  sleep 1
done

echo "=== smoke-api-availability (${DURATION}s) ==="
echo "url: ${URL}"
echo "ok: ${ok}  failures: ${bad}"
echo "codes: ${codes}"
if [[ "$bad" -gt 0 ]]; then
  exit 1
fi
