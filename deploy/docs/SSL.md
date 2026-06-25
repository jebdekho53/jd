# SSL — Let's Encrypt (Certbot) on Ubuntu 22.04

## Prerequisites

- DNS A records pointing to VPS (see DNS.md)
- Nginx installed with HTTP (port 80) server blocks for ACME challenge
- `certbot` and `python3-certbot-nginx` installed

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot
```

## Install certificates

Issue certs for all production domains:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  -d jebdekho.com \
  -d www.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos \
  --no-eff-email

sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos --no-eff-email

sudo certbot certonly --webroot -w /var/www/certbot \
  -d admin.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos --no-eff-email

sudo certbot certonly --webroot -w /var/www/certbot \
  -d merchant.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos --no-eff-email

sudo certbot certonly --webroot -w /var/www/certbot \
  -d rider.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos --no-eff-email

sudo certbot certonly --webroot -w /var/www/certbot \
  -d vendor.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos --no-eff-email

sudo certbot certonly --webroot -w /var/www/certbot \
  -d franchise.jebdekho.com \
  --email ops@jebdekho.com \
  --agree-tos --no-eff-email
```

## Deploy Nginx SSL configs

```bash
sudo cp deploy/nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp deploy/nginx/conf.d/*.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

## Auto-renewal

```bash
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Add post-renew hook:

```bash
echo '#!/bin/bash
systemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

## Verify SSL

```bash
curl -I https://jebdekho.com
curl -I https://api.jebdekho.com/health
openssl s_client -connect jebdekho.com:443 -servername jebdekho.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```
