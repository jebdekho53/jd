#!/usr/bin/env bash
# Repoint every JebDekho subdomain's A record to a new server IP via the
# Hostinger DNS API. Run this at the actual moment of cutover during a VPS
# migration — DNS propagation can take a few minutes to ~24h, so the new
# server should already be fully bootstrapped and verified before this runs.
#
# Usage:
#   HOSTINGER_API_TOKEN=xxxxx ./deploy/scripts/migrate-update-dns.sh <NEW_IP> [domain]
#
# Get a token from hPanel -> API section (https://hpanel.hostinger.com).
# domain defaults to jebdekho.com.
set -euo pipefail

NEW_IP="${1:?Usage: migrate-update-dns.sh <NEW_IP> [domain]}"
DOMAIN="${2:-jebdekho.com}"
TOKEN="${HOSTINGER_API_TOKEN:?Set HOSTINGER_API_TOKEN (get one from hPanel -> API)}"

IP_RE='^([0-9]{1,3}\.){3}[0-9]{1,3}$'
[[ "$NEW_IP" =~ $IP_RE ]] || { echo "ERROR: '$NEW_IP' doesn't look like an IPv4 address" >&2; exit 1; }

HOSTS=(@ www api admin merchant rider vendor franchise)

echo "About to point these hosts on $DOMAIN to $NEW_IP:"
printf '  %s\n' "${HOSTS[@]}"
read -r -p "Type the IP again to confirm ($NEW_IP): " confirm
[[ "$confirm" == "$NEW_IP" ]] || { echo "Confirmation mismatch — aborting, nothing changed." >&2; exit 1; }

# Build the zone array as JSON: one A record per host, all pointing at NEW_IP.
HOSTS_JSON=$(printf '%s\n' "${HOSTS[@]}" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync(0,'utf8').trim().split('\n')))")
ZONE_JSON=$(node -e '
  const hosts = '"$HOSTS_JSON"';
  const ip = process.argv[1];
  const zone = hosts.map((name) => ({
    name,
    type: "A",
    ttl: 300,
    records: [{ content: ip }],
  }));
  process.stdout.write(JSON.stringify({ overwrite: true, zone }));
' "$NEW_IP")

echo "Calling Hostinger API..."
RESPONSE=$(curl -sS -w '\n%{http_code}' -X PUT \
  "https://developers.hostinger.com/api/dns/v1/zones/${DOMAIN}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$ZONE_JSON")

HTTP_CODE=$(tail -n1 <<<"$RESPONSE")
BODY=$(sed '$d' <<<"$RESPONSE")

if [[ "$HTTP_CODE" != 2* ]]; then
  echo "ERROR: Hostinger API returned HTTP $HTTP_CODE" >&2
  echo "$BODY" >&2
  exit 1
fi

echo "DNS updated. Verify propagation with:"
echo "  for h in ${HOSTS[*]/@/$DOMAIN}; do echo \"\$h -> \$(dig +short \$h.$DOMAIN 2>/dev/null || dig +short $DOMAIN)\"; done"
echo "Or check https://dnschecker.org/#A/$DOMAIN"
echo ""
echo "SSL certs on the new server must be (re-)issued AFTER this propagates —"
echo "see deploy/docs/MIGRATION.md step 6."
