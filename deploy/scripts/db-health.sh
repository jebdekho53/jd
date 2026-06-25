#!/usr/bin/env bash
# Database health checks
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f /var/www/jebdekho/.env.production ]]; then
    set -a
    # shellcheck disable=SC1091
    source /var/www/jebdekho/.env.production
    set +a
  fi
fi

echo "=== PostgreSQL connectivity ==="
psql "$DATABASE_URL" -c "SELECT 1 AS ok, current_database(), current_user, now();"

echo ""
echo "=== Migration status ==="
cd /var/www/jebdekho
pnpm exec prisma migrate status --schema=prisma/schema.prisma

echo ""
echo "=== Table counts (sample) ==="
psql "$DATABASE_URL" -c "
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'stores', count(*) FROM stores
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT '_prisma_migrations', count(*) FROM _prisma_migrations;
"

echo ""
echo "=== Connection count ==="
psql "$DATABASE_URL" -c "SELECT count(*) AS active_connections FROM pg_stat_activity WHERE datname = current_database();"
