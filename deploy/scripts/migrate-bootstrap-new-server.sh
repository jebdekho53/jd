#!/usr/bin/env bash
# Run this ON THE NEW SERVER after provisioning it, to bring it up as a full
# replacement for the old JebDekho VPS. Assumes Ubuntu 22.04/24.04.
#
# Prerequisites before running:
#   1. Provision the new VPS, SSH in as root.
#   2. Copy the migration bundle here: scp <bundle>.tar.gz root@<NEW_IP>:/root/
#   3. Know the repo git remote URL (asked below).
#
# Usage:
#   ./migrate-bootstrap-new-server.sh /root/jebdekho_migration_TIMESTAMP.tar.gz
#
# This does NOT touch DNS or run certbot automatically — see
# deploy/docs/MIGRATION.md for the full order of operations.
set -euo pipefail

BUNDLE="${1:?Usage: migrate-bootstrap-new-server.sh <bundle.tar.gz>}"
REPO_URL="${JD_REPO_URL:-}"
APP_DIR="${JD_APP_DIR:-/var/www/jebdekho}"

[[ -f "$BUNDLE" ]] || { echo "ERROR: bundle not found: $BUNDLE" >&2; exit 1; }

log() { printf '\n==> %s\n' "$*"; }

log "Checking system dependencies"
MISSING=()
command -v node   >/dev/null || MISSING+=(node)
command -v pnpm   >/dev/null || MISSING+=(pnpm)
command -v docker >/dev/null || MISSING+=(docker)
command -v nginx  >/dev/null || MISSING+=(nginx)
command -v certbot >/dev/null || MISSING+=(certbot)
command -v pm2    >/dev/null || MISSING+=(pm2)

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "Missing: ${MISSING[*]}"
  read -r -p "Install them now via apt/npm? [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "Aborting — install manually and re-run."; exit 1; }

  apt-get update -y
  apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

  if ! command -v docker >/dev/null; then
    curl -fsSL https://get.docker.com | sh
  fi
  if ! command -v node >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
  if ! command -v pnpm >/dev/null; then
    npm install -g pnpm@9
  fi
  if ! command -v pm2 >/dev/null; then
    npm install -g pm2
  fi
else
  echo "All present: node $(node -v), pnpm $(pnpm -v), docker $(docker -v), nginx present, certbot present, pm2 present"
fi

log "Cloning repository into $APP_DIR"
if [[ -d "$APP_DIR/.git" ]]; then
  echo "$APP_DIR already a git repo — pulling latest instead of cloning"
  git -C "$APP_DIR" pull
else
  [[ -n "$REPO_URL" ]] || { echo "ERROR: set JD_REPO_URL=<git remote> and re-run" >&2; exit 1; }
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

log "Extracting migration bundle"
TMP_EXTRACT=$(mktemp -d)
tar -xzf "$BUNDLE" -C "$TMP_EXTRACT"
BUNDLE_CONTENTS=$(find "$TMP_EXTRACT" -mindepth 1 -maxdepth 1 -type d | head -1)
cat "$BUNDLE_CONTENTS/README.txt" 2>/dev/null || true

cp "$BUNDLE_CONTENTS/.env" "$APP_DIR/.env" 2>/dev/null || echo "  (no .env in bundle, skipped)"
cp "$BUNDLE_CONTENTS/.env.production" "$APP_DIR/.env.production" 2>/dev/null || echo "  (no .env.production in bundle, skipped)"

log "Starting database containers (from repo root — this matters, see MIGRATION.md)"
docker compose up -d postgres redis
echo "Waiting for postgres to be healthy..."
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format '{{.State.Health.Status}}' jebdekho-postgres 2>/dev/null || echo "starting")
  [[ "$STATUS" == "healthy" ]] && break
  sleep 2
done
[[ "$STATUS" == "healthy" ]] || { echo "ERROR: postgres never became healthy" >&2; exit 1; }
echo "postgres healthy"

log "Restoring database from bundle"
set -a; source "$APP_DIR/.env.production"; set +a
echo "WARNING: this overwrites the (currently empty, new) database — should be safe on a fresh server."
read -r -p "Type RESTORE to continue: " confirm
[[ "$confirm" == "RESTORE" ]] || { echo "Aborted at DB restore step."; exit 1; }
gunzip -c "$BUNDLE_CONTENTS/database.sql.gz" | psql "$DATABASE_URL"

log "Installing dependencies and building"
pnpm install --frozen-lockfile
./deploy/scripts/build-production.sh

log "Configuring nginx"
cp -r "$BUNDLE_CONTENTS/nginx/conf.d/"* /etc/nginx/conf.d/ 2>/dev/null || true
cp -r "$BUNDLE_CONTENTS/nginx/snippets/"* /etc/nginx/snippets/ 2>/dev/null || true
nginx -t && systemctl reload nginx
echo "nginx config in place — HTTPS (443) blocks will fail until certbot runs (needs DNS pointed here first)."

log "Starting app processes"
cp "$BUNDLE_CONTENTS/ecosystem.config.js" "$APP_DIR/deploy/ecosystem.config.js"
pm2 start deploy/ecosystem.config.js
pm2 save

rm -rf "$TMP_EXTRACT"

echo ""
echo "================================================================"
echo "Bootstrap done. Remaining manual steps (see deploy/docs/MIGRATION.md):"
echo "  1. Point DNS to this server's IP: HOSTINGER_API_TOKEN=... ./deploy/scripts/migrate-update-dns.sh <THIS_SERVER_IP>"
echo "  2. Wait for DNS propagation (check https://dnschecker.org)"
echo "  3. Run certbot for all domains: certbot --nginx -d jebdekho.com -d www.jebdekho.com -d api.jebdekho.com -d admin.jebdekho.com -d merchant.jebdekho.com -d rider.jebdekho.com -d vendor.jebdekho.com -d franchise.jebdekho.com"
echo "  4. pm2 startup   (enable PM2 on boot)"
echo "  5. Smoke-test every portal, then decommission the old server"
echo "================================================================"
