#!/usr/bin/env bash
#
# Regenerate the Nginx "trust Cloudflare, restore real visitor IP" include from
# Cloudflare's official published ranges.
#
#   Usage:
#     bash deploy/scripts/update-cloudflare-ips.sh            # generate + nginx -t only
#     bash deploy/scripts/update-cloudflare-ips.sh --reload   # also graceful reload on success
#     OUTPUT=/etc/nginx/snippets/cloudflare-real-ip.conf \
#       bash deploy/scripts/update-cloudflare-ips.sh          # write to the live path
#
# Safe by design:
#   * pulls only from https://www.cloudflare.com/ips-v4 and /ips-v6
#   * validates the download is non-empty and CIDR-shaped before using it
#   * backs up the existing file before replacing it
#   * runs `nginx -t`; on failure it RESTORES the backup and exits non-zero
#   * never reloads Nginx unless you pass --reload
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT="${OUTPUT:-$REPO_ROOT/deploy/nginx/snippets/cloudflare-real-ip.conf}"
V4_URL="https://www.cloudflare.com/ips-v4"
V6_URL="https://www.cloudflare.com/ips-v6"
RELOAD=false
[[ "${1:-}" == "--reload" ]] && RELOAD=true

log() { printf '  %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

command -v curl >/dev/null || die "curl is required"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
V4_FILE="$TMP_DIR/v4"
V6_FILE="$TMP_DIR/v6"
NEW_FILE="$TMP_DIR/new.conf"

CIDR_RE='^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$|^([0-9a-fA-F:]+)/[0-9]{1,3}$'

fetch() { # url dest
  log "Fetching $1"
  curl -fsS --max-time 20 "$1" -o "$2" || die "download failed: $1"
  [[ -s "$2" ]] || die "empty response: $1"
  # Every non-blank line must look like a CIDR — guards against captive portals
  # / error pages being silently written into the trusted-source list.
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ $CIDR_RE ]] || die "unexpected content from $1: '$line'"
  done < "$2"
}

fetch "$V4_URL" "$V4_FILE"
fetch "$V6_URL" "$V6_FILE"

v4_count=$(grep -c . "$V4_FILE")
v6_count=$(grep -c . "$V6_FILE")
(( v4_count >= 5 )) || die "suspiciously few IPv4 ranges ($v4_count)"
(( v6_count >= 3 )) || die "suspiciously few IPv6 ranges ($v6_count)"

{
  echo "# Cloudflare real client IP  (GENERATED — do not hand-edit)"
  echo "# Regenerate: bash deploy/scripts/update-cloudflare-ips.sh"
  echo "# Source: $V4_URL , $V6_URL"
  echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "# --- Cloudflare IPv4 ---"
  while IFS= read -r c; do [[ -n "$c" ]] && echo "set_real_ip_from $c;"; done < "$V4_FILE"
  echo
  echo "# --- Cloudflare IPv6 ---"
  while IFS= read -r c; do [[ -n "$c" ]] && echo "set_real_ip_from $c;"; done < "$V6_FILE"
  echo
  echo "real_ip_header CF-Connecting-IP;"
  echo "real_ip_recursive on;"
} > "$NEW_FILE"

log "Generated $((v4_count + v6_count)) ranges"

BACKUP=""
if [[ -f "$OUTPUT" ]]; then
  BACKUP="${OUTPUT}.bak.$(date -u +%Y%m%d%H%M%S)"
  cp -a "$OUTPUT" "$BACKUP"
  log "Backed up existing file → $BACKUP"
fi

mkdir -p "$(dirname "$OUTPUT")"
cp "$NEW_FILE" "$OUTPUT"
log "Wrote $OUTPUT"

# Validate — only meaningful when the file is on the live include path AND nginx
# is present. In CI (writing to the repo copy) nginx -t would test the live
# config, so we skip validation unless the output is under /etc/nginx.
if command -v nginx >/dev/null && [[ "$OUTPUT" == /etc/nginx/* ]]; then
  log "Running nginx -t"
  if ! nginx -t; then
    if [[ -n "$BACKUP" ]]; then
      cp "$BACKUP" "$OUTPUT"
      die "nginx -t failed — restored previous file from $BACKUP"
    fi
    rm -f "$OUTPUT"
    die "nginx -t failed — removed the freshly written (previously absent) file"
  fi
  log "nginx -t OK"
  if $RELOAD; then
    log "Gracefully reloading nginx"
    nginx -s reload
    log "Reloaded"
  else
    log "Not reloading (pass --reload to apply). Run: sudo nginx -s reload"
  fi
else
  log "Skipped nginx -t (nginx absent or writing to repo copy, not /etc/nginx)."
  log "Copy to the live path and validate, e.g.:"
  log "  sudo cp $OUTPUT /etc/nginx/snippets/cloudflare-real-ip.conf && sudo nginx -t"
fi

log "Done."
