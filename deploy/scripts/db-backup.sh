#!/usr/bin/env bash
# PostgreSQL backup — run via cron daily
set -euo pipefail

BACKUP_DIR="${JD_BACKUP_DIR:-/var/backups/jebdekho/postgres}"
RETENTION_DAYS="${JD_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="jebdekho_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f /var/www/jebdekho/.env.production ]]; then
    set -a
    # shellcheck disable=SC1091
    source /var/www/jebdekho/.env.production
    set +a
  else
    echo "DATABASE_URL not set"
    exit 1
  fi
fi

# DATABASE_URL cannot be handed to pg_dump as-is. Prisma tolerates two things
# libpq does not: the ?schema=public query parameter ("invalid URI query
# parameter"), and an unencoded "@" inside the password, which libpq splits on
# so the host comes out as garbage. So the parts are extracted and passed as
# explicit flags instead of re-encoding a URL.
#
# This mattered: pg_dump failed on every run, and because a pipeline's exit
# status is its LAST command, `set -e` never fired — each backup silently wrote
# a 20-byte empty gzip that looked like a real file.
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

set -o pipefail
pg_dump | gzip > "${BACKUP_DIR}/${FILENAME}"
unset PGPASSWORD

SIZE=$(stat -c %s "${BACKUP_DIR}/${FILENAME}")
if [[ "$SIZE" -lt 10000 ]]; then
  echo "Backup looks empty (${SIZE} bytes) — refusing to treat it as valid" >&2
  exit 1
fi
echo "Backup written: ${BACKUP_DIR}/${FILENAME} (${SIZE} bytes)"

find "$BACKUP_DIR" -name 'jebdekho_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Pruned backups older than ${RETENTION_DAYS} days"
