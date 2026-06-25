#!/usr/bin/env bash
# Validate .env.production before PM2 start
set -euo pipefail

ROOT="${JD_APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENV_FILE="${ROOT}/.env.production"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing $ENV_FILE"
  exit 1
fi

required=(
  DATABASE_URL
  REDIS_URL
  JWT_PRIVATE_KEY
  JWT_PUBLIC_KEY
  CORS_ORIGINS
)

for key in "${required[@]}"; do
  if ! grep -qE "^${key}=" "$ENV_FILE"; then
    echo "ERROR: ${key} is not set in .env.production"
    exit 1
  fi
done

# Remove empty DEV_DEMO_OTP (breaks Joi length validation)
if grep -qE '^DEV_DEMO_OTP=$' "$ENV_FILE"; then
  echo "WARN: Removing empty DEV_DEMO_OTP= from .env.production"
  sed -i '/^DEV_DEMO_OTP=$/d' "$ENV_FILE"
fi

# Boot without MSG91 / Razorpay until keys are configured
if grep -qE '^SMS_PROVIDER=msg91$' "$ENV_FILE" && ! grep -qE '^MSG91_AUTH_KEY=.+' "$ENV_FILE"; then
  echo "WARN: SMS_PROVIDER=msg91 but MSG91_AUTH_KEY empty — switching to console"
  sed -i 's/^SMS_PROVIDER=msg91$/SMS_PROVIDER=console/' "$ENV_FILE"
fi
sed -i '/^MSG91_AUTH_KEY=$/d;/^MSG91_TEMPLATE_ID=$/d;/^MSG91_DLT_TE_ID=$/d' "$ENV_FILE"
sed -i '/^RAZORPAY_KEY_SECRET=$/d;/^RAZORPAY_WEBHOOK_SECRET=$/d;/^RAZORPAY_KEY_ID=$/d' "$ENV_FILE"

node --env-file="$ENV_FILE" <<'NODE'
const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY', 'CORS_ORIGINS'];
for (const key of required) {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    console.error(`ERROR: ${key} is empty`);
    process.exit(1);
  }
}

const priv = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
const pub = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
if (!priv.includes('BEGIN RSA PRIVATE KEY') && !priv.includes('BEGIN PRIVATE KEY')) {
  console.error('ERROR: JWT_PRIVATE_KEY does not look like a PEM private key');
  process.exit(1);
}
if (!pub.includes('BEGIN PUBLIC KEY')) {
  console.error('ERROR: JWT_PUBLIC_KEY does not look like a PEM public key');
  process.exit(1);
}

console.log('Production env verification passed');
NODE

echo "OK: .env.production verified"

# pnpm isolates deps per package — API must run from apps/api
(
  cd "${ROOT}/apps/api"
  node -e "require('express'); console.log('OK: API node_modules resolve from apps/api')"
)
