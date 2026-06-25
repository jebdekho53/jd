# Go-Live Checklist — JebDekho

## Pre-deploy

- [ ] VPS provisioned (Ubuntu 22.04, 4GB+ RAM recommended)
- [ ] Node.js 20+, pnpm 9+, PM2, Nginx, PostgreSQL 16, Redis 7 installed
- [ ] DNS A records configured (see DNS.md)
- [ ] `.env.production` created from `.env.production.example` with real secrets
- [ ] Fresh JWT RS256 key pair generated for production
- [ ] Razorpay LIVE keys configured
- [ ] MSG91 production SMS configured
- [ ] SMTP credentials verified (`deploy/scripts/test-email.sh`)
- [ ] Google Maps API key restricted to production domains

## Deploy

```bash
sudo mkdir -p /var/www/jebdekho /var/log/jebdekho /var/www/jebdekho/uploads
sudo chown -R $USER:www-data /var/www/jebdekho
git clone <repo> /var/www/jebdekho
cd /var/www/jebdekho
cp .env.production.example .env.production  # fill secrets
chmod +x deploy/*.sh deploy/scripts/*.sh
./deploy/scripts/db-migrate.sh
pnpm install && pnpm build
pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup
```

## Nginx + SSL

- [ ] Nginx configs copied from `deploy/nginx/`
- [ ] SSL certificates issued (see SSL.md)
- [ ] `nginx -t` passes
- [ ] HTTPS redirect working on all domains

## Post-deploy verification

- [ ] `curl https://api.jebdekho.com/health` → `{"status":"ok"}`
- [ ] `curl https://api.jebdekho.com/health/ready` → all checks up
- [ ] Buyer site loads: https://jebdekho.com
- [ ] Admin login: https://admin.jebdekho.com
- [ ] Merchant portal: https://merchant.jebdekho.com
- [ ] OTP SMS delivers in production
- [ ] Razorpay test payment (₹1) succeeds
- [ ] WebSocket tracking connects (`wss://api.jebdekho.com/tracking`)
- [ ] `robots.txt` and `sitemap.xml` accessible
- [ ] Database backup cron configured

## Rollback plan

```bash
./deploy/rollback.sh
```

## Monitoring

- [ ] PM2 monitoring: `pm2 monit`
- [ ] Log rotation configured for `/var/log/jebdekho/`
- [ ] Daily DB backup cron: `0 2 * * * /var/www/jebdekho/deploy/scripts/db-backup.sh`
