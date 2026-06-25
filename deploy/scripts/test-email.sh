#!/usr/bin/env bash
# Send test email via Hostinger SMTP config
set -euo pipefail

APP_DIR="${JD_APP_DIR:-/var/www/jebdekho}"
TO="${1:-admin@jebdekho.com}"

if [[ -f "$APP_DIR/.env.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env.production"
  set +a
fi

SMTP_PASS="${SMTP_PASS:-${SMTP_PASSWORD:-}}"
SMTP_SECURE="${SMTP_SECURE:-true}"

# nodemailer is a dependency of apps/api, not the monorepo root
cd "$APP_DIR/apps/api"

node -e "
const nodemailer = require('nodemailer');
const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass } : undefined,
});
transport.sendMail({
  from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'JebDekho <support@jebdekho.com>',
  to: '$TO',
  subject: 'JebDekho production SMTP test',
  text: 'SMTP configuration is working.',
}).then(() => console.log('Sent to $TO')).catch((e) => { console.error(e); process.exit(1); });
"
