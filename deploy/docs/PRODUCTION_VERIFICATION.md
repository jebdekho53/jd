# Production Verification Checklist

Run after every deploy.

## API

```bash
curl -fsS https://api.jebdekho.com/health
curl -fsS https://api.jebdekho.com/health/ready | jq .
curl -fsS https://api.jebdekho.com/api/v1/public/knowledge | jq .success
```

## Web apps

| URL | Expected |
|-----|----------|
| https://jebdekho.com | 200, buyer homepage |
| https://admin.jebdekho.com/login | 200 |
| https://merchant.jebdekho.com/login | 200 |
| https://rider.jebdekho.com | 200 |
| https://vendor.jebdekho.com | 200 |
| https://franchise.jebdekho.com | 200 |

## SEO

```bash
curl -fsS https://jebdekho.com/robots.txt | head
curl -fsS https://jebdekho.com/sitemap.xml | head
curl -fsS https://jebdekho.com/llms.txt | head
curl -fsS https://jebdekho.com/api/public/knowledge | jq .success
```

## Security

- [ ] No mixed content warnings in browser console
- [ ] Cookies set with `Secure` flag on HTTPS
- [ ] CORS blocks unauthorized origins
- [ ] Rate limiting active (429 after burst)
- [ ] Swagger docs NOT exposed in production

## Payments

- [ ] Razorpay webhook URL: `https://api.jebdekho.com/api/v1/payments/razorpay/webhook`
- [ ] Webhook signature verification passes in logs

## Database

```bash
./deploy/scripts/db-health.sh
```

## PM2

```bash
pm2 status
pm2 logs jebdekho-api --lines 50
```
