#!/usr/bin/env bash
# Manual VPS update — safe when NODE_ENV=production is set in the shell.
# Prefer: pnpm deploy:production
set -euo pipefail

cd "${JD_APP_DIR:-/var/www/jebdekho}"

echo "==> Pull latest"
git pull origin main

echo "==> Install (includes devDependencies for turbo/typescript)"
corepack enable
(
  unset NODE_ENV
  export CI=true
  pnpm install --frozen-lockfile --prod=false
)

echo "==> Migrate database"
./deploy/scripts/db-migrate.sh

echo "==> Seed platform roles"
pnpm db:seed:platform

echo "==> Build"
./deploy/scripts/build-production.sh

echo "==> Restart PM2"
pm2 restart deploy/ecosystem.config.js

echo "==> Done. Verify: curl http://127.0.0.1:\${API_PORT:-3001}/health"
