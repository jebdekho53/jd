# Security Hardening — Production Audit Checklist

## Application

- [ ] `NODE_ENV=production` on all PM2 processes
- [ ] `TRUST_PROXY=true` behind Nginx
- [ ] `CORS_ORIGINS` lists only `*.jebdekho.com` portals (no wildcards)
- [ ] Helmet enabled (API `main.ts`)
- [ ] JWT RS256 keys unique to production (`JWT_KEY_ID=prod-*`)
- [x] `DEV_DEMO_*` bypasses and demo credentials fully removed from codebase
- [ ] Rate limiting: `THROTTLE_LIMIT`, `AUTH_THROTTLE_LIMIT` configured
- [ ] Razorpay webhook signature verification enabled (`RAZORPAY_WEBHOOK_SECRET`)
- [ ] Cookie sessions: `Secure`, `HttpOnly`, `SameSite=Lax` on portal BFF routes

## Infrastructure

- [ ] UFW: allow 22, 80, 443 only
- [ ] SSH key-only auth, disable password login
- [ ] PostgreSQL listens on `127.0.0.1` only
- [ ] Redis password set, bind `127.0.0.1`
- [ ] `/var/www/jebdekho/uploads` owned by deploy user, not world-writable
- [ ] `.env.production` mode `600`, not in git
- [ ] Nginx `server_tokens off`
- [ ] HSTS enabled on all HTTPS vhosts
- [ ] Certbot auto-renew timer active

## Secrets rotation

- [ ] JWT key pair rotation procedure documented
- [ ] Razorpay key rotation on compromise
- [ ] MSG91 / SMTP credentials in secrets manager or encrypted vault
- [ ] Database password rotated quarterly

## Monitoring

- [ ] `curl https://api.jebdekho.com/health` in uptime monitor
- [ ] PM2 `pm2 startup` configured
- [ ] Log rotation for `/var/log/jebdekho/`
- [ ] Daily DB backup cron (`deploy/scripts/db-backup.sh`)
- [ ] Sentry DSN configured (optional)

## Payment & webhooks

- [ ] Razorpay webhook URL: `https://api.jebdekho.com/api/v1/payments/razorpay/webhook`
- [ ] Webhook secret matches dashboard
- [ ] Live keys (`rzp_live_*`) only in production `.env.production`

## Maps & third-party

- [ ] Google Maps API key restricted by HTTP referrer (`*.jebdekho.com`)
