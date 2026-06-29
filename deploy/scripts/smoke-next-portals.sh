#!/usr/bin/env bash
# Verify Next.js portals serve matching static build assets (catches ISS-003/012).
set -euo pipefail

check_portal() {
  local name="$1"
  local port="$2"
  local html
  html=$(curl -fsS "http://127.0.0.1:${port}/login" 2>/dev/null || curl -fsS "http://127.0.0.1:${port}/" 2>/dev/null)
  local build_id
  build_id=$(printf '%s' "$html" | grep -oE '"buildId":"[^"]+"' | head -1 | cut -d'"' -f4)
  if [[ -z "$build_id" ]]; then
    echo "FAIL: ${name} — could not parse buildId from HTML"
    return 1
  fi
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" \
    "http://127.0.0.1:${port}/_next/static/${build_id}/_buildManifest.js")
  if [[ "$code" != "200" ]]; then
    echo "FAIL: ${name} — _buildManifest.js returned HTTP ${code} (buildId=${build_id})"
    return 1
  fi
  echo "OK: ${name} buildId=${build_id}"
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
