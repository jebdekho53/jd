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

# Disable Shadowfax until API URL is configured (pre-launch safe; API defaults ENABLE_SHADOWFAX=true)
if ! grep -qE '^SHADOWFAX_API_URL=.+' "$ENV_FILE"; then
  if ! grep -qE '^ENABLE_SHADOWFAX=false$' "$ENV_FILE"; then
    echo "WARN: SHADOWFAX_API_URL not set — disabling Shadowfax until configured"
    if grep -qE '^ENABLE_SHADOWFAX=' "$ENV_FILE"; then
      sed -i 's/^ENABLE_SHADOWFAX=.*/ENABLE_SHADOWFAX=false/' "$ENV_FILE"
    else
      echo 'ENABLE_SHADOWFAX=false' >> "$ENV_FILE"
    fi
  fi
fi

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

const jwtIssuer = (process.env.JWT_ISSUER || 'jebdekho-api').trim();
if (/jebdehko/i.test(jwtIssuer)) {
  console.error('ERROR: JWT_ISSUER contains typo "jebdehko" — use https://api.jebdekho.com');
  process.exit(1);
}
if (jwtIssuer.includes('jebdekho') && !jwtIssuer.includes('jebdekho.com')) {
  console.warn('WARN: JWT_ISSUER should be https://api.jebdekho.com for production OIDC clients');
}

// Google Maps (warn only — master directory fallback)
const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
if (!gmapsKey.trim()) {
  console.warn('WARN: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing — buyer/merchant maps will use directory fallback');
}

// Shadowfax — required only when explicitly enabled with credentials
const shadowfaxEnabled = (process.env.ENABLE_SHADOWFAX || 'false') === 'true';
const deliveryProvider = (process.env.DELIVERY_PROVIDER || 'shadowfax').toLowerCase();
if (shadowfaxEnabled && deliveryProvider === 'shadowfax') {
  const shadowfaxVars = [
    ['SHADOWFAX_API_URL', process.env.SHADOWFAX_API_URL || ''],
    ['SHADOWFAX_WEBHOOK_SECRET', process.env.SHADOWFAX_WEBHOOK_SECRET || ''],
  ];
  for (const [key, val] of shadowfaxVars) {
    if (!String(val).trim()) {
      console.error(`ERROR: ${key} is required when ENABLE_SHADOWFAX=true and DELIVERY_PROVIDER=shadowfax`);
      process.exit(1);
    }
  }
  if (process.env.ENABLE_OWN_FLEET === 'true') {
    console.error('ERROR: ENABLE_OWN_FLEET must be false when DELIVERY_PROVIDER=shadowfax');
    process.exit(1);
  }
  const token = process.env.SHADOWFAX_PRODUCTION_TOKEN || process.env.SHADOWFAX_TEST_TOKEN || '';
  if (!token.trim()) {
    console.error('ERROR: SHADOWFAX_PRODUCTION_TOKEN or SHADOWFAX_TEST_TOKEN required when Shadowfax is enabled');
    process.exit(1);
  }
  const apiUrl = String(process.env.SHADOWFAX_API_URL || '').toLowerCase();
  const apiMode = String(process.env.SHADOWFAX_API_MODE || '').toLowerCase();
  const flashMode =
    apiMode === 'flash' ||
    apiMode === 'hyperlocal' ||
    apiMode === 'hl' ||
    apiUrl.includes('flash-api.shadowfax') ||
    apiUrl.includes('hlbackend');
  if (flashMode && !String(process.env.SHADOWFAX_CREDITS_KEY || '').trim()) {
    console.error('ERROR: SHADOWFAX_CREDITS_KEY required for Shadowfax Flash/hyperlocal (SHADOWFAX_API_MODE=flash or flash-api/hlbackend URL)');
    process.exit(1);
  }
  if (apiUrl.endsWith('/api/v3')) {
    console.warn('WARN: SHADOWFAX_API_URL should be host-only — remove trailing /api/v3');
  }
} else if (deliveryProvider === 'shadowfax' && !shadowfaxEnabled) {
  console.warn('WARN: Shadowfax delivery disabled until SHADOWFAX_API_URL and tokens are configured');
}
NODE

echo "OK: .env.production verified"

# pnpm isolates deps per package — API must run from apps/api
(
  cd "${ROOT}/apps/api"
  node -e "require('express'); console.log('OK: API node_modules resolve from apps/api')"
)
