#!/usr/bin/env bash
# Build all apps with production environment variables loaded.
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT"

if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
else
  echo "ERROR: .env.production not found at $ROOT/.env.production"
  exit 1
fi

export NODE_ENV=production

echo "==> Prisma generate"
pnpm db:generate

if [[ "${SEED_MENU_CATALOG:-1}" == "1" ]]; then
  echo "==> Seeding MENU catalog (Food, Cafe, …)"
  pnpm seed:menu-catalog
fi

echo "==> Building API"
# Nest deletes dist/ but leaves tsbuildinfo; incremental tsc then emits nothing.
rm -rf apps/api/dist apps/api/tsconfig.build.tsbuildinfo apps/api/tsconfig.tsbuildinfo
pnpm --filter @jebdekho/api run build
if [[ ! -f apps/api/dist/main.js ]]; then
  echo "ERROR: API build did not produce apps/api/dist/main.js"
  exit 1
fi

build_next_app() {
  local app_dir="$1"
  local app_url="$2"
  local extra_env="${3:-}"

  echo "==> Building $(basename "$app_dir")"
  (
    cd "$app_dir"
    export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.jebdekho.com/api/v1}"
    export NEXT_PUBLIC_API_ORIGIN="${NEXT_PUBLIC_API_ORIGIN:-https://api.jebdekho.com}"
    export NEXT_PUBLIC_APP_URL="$app_url"
    if [[ -n "$extra_env" ]]; then
      # shellcheck disable=SC2086
      export $extra_env
    fi
    pnpm run build
  )
}

build_next_app apps/buyer-web "${BUYER_URL:-https://jebdekho.com}" \
  "NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL:-wss://api.jebdekho.com} NEXT_PUBLIC_SITE_URL=${BUYER_SITE_URL:-https://jebdekho.com} NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-}"

build_next_app apps/admin-web "${ADMIN_URL:-https://admin.jebdekho.com}"
build_next_app apps/merchant-web "${MERCHANT_URL:-https://merchant.jebdekho.com}" \
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:-}"
build_next_app apps/rider-web "${RIDER_URL:-https://rider.jebdekho.com}"
build_next_app apps/vendor-web "${VENDOR_URL:-https://vendor.jebdekho.com}"
build_next_app apps/franchise-web "${FRANCHISE_URL:-https://franchise.jebdekho.com}"

echo "==> Production build complete"
