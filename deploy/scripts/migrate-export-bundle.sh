#!/usr/bin/env bash
# Package everything the new server needs that ISN'T in git: the database,
# secrets (.env/.env.production), and PM2/nginx config. Run this on the OLD
# server, then scp the resulting tarball to the new one before running
# migrate-bootstrap-new-server.sh there.
#
# Usage: ./deploy/scripts/migrate-export-bundle.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="${JD_MIGRATION_DIR:-/var/backups/jebdekho/migration}"
BUNDLE_DIR="$OUT_DIR/bundle_${TIMESTAMP}"
TARBALL="$OUT_DIR/jebdekho_migration_${TIMESTAMP}.tar.gz"

mkdir -p "$BUNDLE_DIR"

echo "==> Dumping database"
if [[ -z "${DATABASE_URL:-}" && -f .env.production ]]; then
  set -a; source .env.production; set +a
fi
eval "$(node -e '
  const u = new URL(process.env.DATABASE_URL);
  const q = (v) => "\x27" + String(v).replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
  process.stdout.write(
    "PGHOST=" + q(u.hostname) +
    "\nPGPORT=" + q(u.port || 5432) +
    "\nPGUSER=" + q(decodeURIComponent(u.username)) +
    "\nPGDATABASE=" + q(u.pathname.slice(1)) +
    "\nPGPASSWORD=" + q(decodeURIComponent(u.password)) + "\n"
  );
')"
export PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD
pg_dump | gzip > "$BUNDLE_DIR/database.sql.gz"
unset PGPASSWORD
DB_SIZE=$(stat -c %s "$BUNDLE_DIR/database.sql.gz")
if [[ "$DB_SIZE" -lt 10000 ]]; then
  echo "ERROR: DB dump looks empty (${DB_SIZE} bytes) — aborting" >&2
  exit 1
fi
echo "    database.sql.gz: ${DB_SIZE} bytes"

echo "==> Copying secrets and config"
cp .env "$BUNDLE_DIR/.env" 2>/dev/null || true
cp .env.production "$BUNDLE_DIR/.env.production" 2>/dev/null || true
cp -r deploy/nginx "$BUNDLE_DIR/nginx"
cp deploy/ecosystem.config.js "$BUNDLE_DIR/ecosystem.config.js"

echo "==> Recording current PM2 process list (reference only)"
pm2 jlist > "$BUNDLE_DIR/pm2-processes.json" 2>/dev/null || echo '[]' > "$BUNDLE_DIR/pm2-processes.json"

echo "==> Recording git commit this was built from"
git rev-parse HEAD > "$BUNDLE_DIR/git-commit.txt"
git branch --show-current > "$BUNDLE_DIR/git-branch.txt"

cat > "$BUNDLE_DIR/README.txt" <<EOF
JebDekho migration bundle — created ${TIMESTAMP}
From server: $(hostname)
Git commit: $(cat "$BUNDLE_DIR/git-commit.txt")

Contents:
  database.sql.gz    — full Postgres dump (gzip)
  .env / .env.production — secrets, DO NOT commit or share outside migration
  nginx/             — nginx.conf + conf.d + snippets (domain-based, no IP changes needed)
  ecosystem.config.js — PM2 process definitions
  pm2-processes.json — reference snapshot of what was running

Next step: scp this tarball to the new server, then run
deploy/scripts/migrate-bootstrap-new-server.sh there.
EOF

echo "==> Creating tarball"
tar -czf "$TARBALL" -C "$OUT_DIR" "$(basename "$BUNDLE_DIR")"
rm -rf "$BUNDLE_DIR"

TARBALL_SIZE=$(stat -c %s "$TARBALL")
echo ""
echo "Bundle ready: $TARBALL (${TARBALL_SIZE} bytes)"
echo ""
echo "Copy it to the new server, e.g.:"
echo "  scp $TARBALL root@<NEW_IP>:/root/"
