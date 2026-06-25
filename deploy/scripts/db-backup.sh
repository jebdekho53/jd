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

pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"
echo "Backup written: ${BACKUP_DIR}/${FILENAME}"

find "$BACKUP_DIR" -name 'jebdekho_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Pruned backups older than ${RETENTION_DAYS} days"
