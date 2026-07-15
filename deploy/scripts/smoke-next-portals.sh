#!/usr/bin/env bash
# Verify Next.js portals serve matching static build assets (catches ISS-003/012).
set -euo pipefail

check_portal() {
  local name="$1"
  local port="$2"
  local html
  html=$(curl -fsS "http://127.0.0.1:${port}/login" 2>/dev/null || curl -fsS "http://127.0.0.1:${port}/" 2>/dev/null)
  # App Router (Next 15) doesn't embed "buildId" in the HTML the way Pages Router
  # did; the real signal is whether a static chunk the page actually references
  # still serves. Pull a chunk straight out of the served HTML and fetch it — a
  # stale in-place build is exactly what makes that chunk 400.
  local chunk
  chunk=$(printf '%s' "$html" | grep -oE '/_next/static/(chunks|css)/[^"]+\.(js|css)' | head -1)
  if [[ -z "$chunk" ]]; then
    echo "FAIL: ${name} — no /_next/static asset referenced in HTML"
    return 1
  fi
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}${chunk}")
  if [[ "$code" != "200" ]]; then
    echo "FAIL: ${name} — static asset ${chunk} returned HTTP ${code}"
    return 1
  fi
  echo "OK: ${name} asset=${chunk}"
}

FAIL=0
check_portal "buyer-web" 3000 || FAIL=1
check_portal "merchant-web" 3002 || FAIL=1
check_portal "admin-web" 3003 || FAIL=1

if [[ "$FAIL" -ne 0 ]]; then
  echo "Next.js static asset smoke failed — rebuild and pm2 reload all portals"
  exit 1
fi

echo "Next.js portal static smoke passed"
