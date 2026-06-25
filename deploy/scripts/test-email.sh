#!/usr/bin/env bash
# Send test email via API SMTP config
set -euo pipefail

TO="${1:-admin@jebdekho.com}"

if [[ -f /var/www/jebdekho/.env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source /var/www/jebdekho/.env.production
  set +a
fi

node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
});
transport.sendMail({
  from: process.env.SMTP_FROM || 'noreply@jebdekho.com',
  to: '$TO',
  subject: 'JebDekho production SMTP test',
  text: 'SMTP configuration is working.',
}).then(() => console.log('Sent to $TO')).catch((e) => { console.error(e); process.exit(1); });
"
