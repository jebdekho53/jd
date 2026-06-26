#!/usr/bin/env bash
# Apply Prisma migrations in production
set -euo pipefail

cd "${JD_APP_DIR:-/var/www/jebdekho}"

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

echo "Generating Prisma client..."
pnpm db:generate

echo "Migration status (before):"
pnpm exec prisma migrate status --schema=prisma/schema.prisma || true

echo "Deploying migrations..."
pnpm db:deploy

echo "Migration status (after):"
pnpm exec prisma migrate status --schema=prisma/schema.prisma

echo "Done."
