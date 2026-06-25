# DNS Records — JebDekho Production

Replace `YOUR_VPS_IP` with your Ubuntu 22.04 server public IPv4 address.

## A Records

| Host / Name | Type | Value | TTL |
|-------------|------|-------|-----|
| `@` | A | `YOUR_VPS_IP` | 300 |
| `www` | A | `YOUR_VPS_IP` | 300 |
| `api` | A | `YOUR_VPS_IP` | 300 |
| `admin` | A | `YOUR_VPS_IP` | 300 |
| `merchant` | A | `YOUR_VPS_IP` | 300 |
| `rider` | A | `YOUR_VPS_IP` | 300 |
| `vendor` | A | `YOUR_VPS_IP` | 300 |
| `franchise` | A | `YOUR_VPS_IP` | 300 |

## Optional CDN (future)

| Host | Type | Value |
|------|------|-------|
| `cdn` | CNAME | `YOUR_R2_OR_CDN_ENDPOINT` |

## Verification Checklist

- [ ] All A records resolve to VPS IP: `dig +short jebdekho.com`
- [ ] `dig +short api.jebdekho.com` returns VPS IP
- [ ] `dig +short admin.jebdekho.com` returns VPS IP
- [ ] `dig +short merchant.jebdekho.com` returns VPS IP
- [ ] `dig +short rider.jebdekho.com` returns VPS IP
- [ ] `dig +short vendor.jebdekho.com` returns VPS IP
- [ ] `dig +short franchise.jebdekho.com` returns VPS IP
- [ ] DNS propagation complete (use https://dnschecker.org)
- [ ] `www` redirects to apex (configured in Nginx)
- [ ] Firewall allows 80/tcp and 443/tcp on VPS

## Example dig commands

```bash
for h in jebdekho.com www.jebdekho.com api.jebdekho.com admin.jebdekho.com merchant.jebdekho.com rider.jebdekho.com vendor.jebdekho.com franchise.jebdekho.com; do
  echo "$h -> $(dig +short $h)"
done
```
