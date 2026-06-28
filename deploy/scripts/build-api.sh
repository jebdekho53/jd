#!/usr/bin/env bash
# Build API only — always regenerates Prisma client first (required after schema pulls).
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT"

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

echo "==> Prisma migrate + generate"
./deploy/scripts/db-migrate.sh

echo "==> Build API"
pnpm --filter @jebdekho/api build

if [[ ! -f apps/api/dist/main.js ]]; then
  echo "ERROR: apps/api/dist/main.js missing after build"
  exit 1
fi

echo "==> Verify claim-policy DTOs load (IsEnum boot check)"
(
  cd "${ROOT}/apps/api"
  node -e "
    require('./dist/modules/product/dto/create-product.dto');
    require('./dist/modules/order-claim/dto/order-claim.dto');
    console.log('OK: claim policy DTOs load without Prisma enum crash');
  "
)

echo "==> API build OK — reload with: pm2 reload jebdekho-api --update-env"
echo "    Then wait ~5s and: curl http://127.0.0.1:\${API_PORT:-3001}/health"
