#!/usr/bin/env bash
# Restore PostgreSQL from gzip dump
# Usage: ./db-restore.sh /var/backups/jebdekho/postgres/jebdekho_20260723.sql.gz
set -euo pipefail

DUMP_FILE="${1:?Usage: db-restore.sh <dump.sql.gz>}"

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

echo "WARNING: This will overwrite the current database."
read -r -p "Type RESTORE to continue: " confirm
[[ "$confirm" == "RESTORE" ]] || exit 1

gunzip -c "$DUMP_FILE" | psql "$DATABASE_URL"
echo "Restore complete."
