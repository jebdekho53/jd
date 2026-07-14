# Cloudflare Free CDN — Setup & Operations

This document covers the repository/VPS changes that make JebDekho ready to sit
behind Cloudflare's Free CDN, and the **manual dashboard steps you must still
perform yourself**. Nothing here changes DNS, nameservers, or any Cloudflare
account setting — those remain your job (see the checklist at the end).

> **Status without action:** Every change below is backwards-compatible and
> inert until you switch nameservers and enable the orange-cloud proxy in
> Cloudflare. Uploads keep loading and all existing URLs keep working today.

---

## 1. What was implemented in the repository

| Area | Change |
| --- | --- |
| Config | Added optional `CDN_PUBLIC_URL` env var (validated, defaults to empty). Empty ⇒ identical to pre-CDN behaviour. |
| Backend helper | New `apps/api/src/common/utils/asset-url.util.ts` centralises public-asset URL generation (`buildUploadUrl`, `assetPublicBase`, `uploadPublicBases`, `resolvePublicAssetUrl`) with unit tests. |
| Backend services | `upload.service`, `ai-product-image.service`, `ai-catalog-image-processing.service` now generate URLs through the helper. Trust checks (`trusted-upload-url.util`, `claim-evidence.util`) and reverse file lookups accept **both** the canonical upload base and an optional CDN base, so enabling a CDN later never invalidates existing URLs. |
| API static fallback | `main.ts` `useStaticAssets` now sets `Cache-Control` + `X-Content-Type-Options: nosniff` and disables index serving (dev/fallback path; Nginx serves `/uploads/` in prod). |
| Next.js | Shared `uploadImageRemotePatterns()` in `@jebdekho/web-config` replaces the duplicated `images.remotePatterns` in buyer/merchant/admin. Allows `api.jebdekho.com/uploads/**` + optional `NEXT_PUBLIC_UPLOAD_HOST`; no wildcard hosts. |
| Nginx | `/uploads/` gets safe cache + security headers via `snippets/uploads-cache.conf`; SVG/HTML/XML uploads are forced to download (inert); gzip extended to manifests/JS; new `snippets/cloudflare-real-ip.conf` restores the real visitor IP. |
| Scripts | `deploy/scripts/update-cloudflare-ips.sh` regenerates the Cloudflare IP include from official sources. `scripts/cloudflare-cdn-preflight.ts` is a read-only readiness check (`pnpm cdn:preflight`). |

**Not changed:** database schema, webhook signature verification, cookie
security, CORS allowlist, existing absolute DB image URLs, live Certbot vhosts
(a documented patch is provided instead of an overwrite). Uploads stay on the
VPS — no R2/S3 migration.

---

## 2. Environment variables

Add to `.env.production` (see `.env.production.example`):

```env
UPLOAD_PUBLIC_URL=https://api.jebdekho.com/uploads   # canonical (already set)
CDN_PUBLIC_URL=                                        # leave EMPTY for first rollout
# NEXT_PUBLIC_UPLOAD_HOST=cdn.jebdekho.com             # only if CDN uses a new host
```

- `CDN_PUBLIC_URL` is **optional**. Empty preserves current behaviour exactly.
- Do **not** set `CDN_PUBLIC_URL=https://cdn.jebdekho.com` unless that hostname
  actually exists and resolves. For the first rollout the CDN works
  transparently through the proxied `api.jebdekho.com`.
- `NEXT_PUBLIC_UPLOAD_HOST` is a **build-time public** var (a hostname, never a
  secret). Rebuild the web apps after changing it.

---

## 3. Upload URL behaviour

- The API stores and returns **absolute** image URLs built from
  `CDN_PUBLIC_URL || UPLOAD_PUBLIC_URL`.
- With `CDN_PUBLIC_URL` empty, new uploads → `https://api.jebdekho.com/uploads/...`
  exactly as before. Existing DB rows are untouched.
- If `CDN_PUBLIC_URL` is later set, **new** uploads use the CDN base; **old**
  URLs keep resolving because both bases are trusted and reverse-mapped, and
  `api.jebdekho.com` stays proxied. No database migration is performed.
- The helper preserves external URLs, query/signature params, and collapses
  duplicate slashes / `/uploads/uploads`.

---

## 4. Cache-TTL strategy

| Resource | Cache-Control | Reason |
| --- | --- | --- |
| `/uploads/*` (images, PDFs) | `public, max-age=86400, stale-while-revalidate=604800` | UUID/content-addressed filenames; a replaced image gets a new URL, so a cached object is never stale for a path that still resolves. 1-day TTL + 7-day SWR offloads heavily without risk. |
| `/uploads/*.svg,.html,.xml` | same + `Content-Disposition: attachment` | Neutralise active content — download inert, never execute. |
| `_next/static/*` | `public, max-age=31536000, immutable` | Build-hashed filenames — content change ⇒ new filename. |
| `/api/*`, auth, cart, checkout, payments, orders, webhooks | not publicly cached (no `public` header) | Personalised/sensitive. Add a Cloudflare **Bypass** cache rule. |
| HTML pages (authenticated/personalised) | proxied to Next.js, not edge-cached | Contain per-user content. |

> Uploads are content-addressed, so `public, max-age=31536000, immutable` is
> also technically safe. We default to the shorter SWR window as the least
> risky choice; switch in `snippets/uploads-cache.conf` if you want maximum
> offload.

---

## 5. Cache-invalidation strategy

- **Product/store images** are UUID-named. Replacing an image uploads a **new
  file at a new URL** and updates the DB; the old URL is simply no longer
  referenced. **The CDN never needs a purge** — the URL itself is the cache key
  and it changes with the content.
- No upload path overwrites a file in place (verified: all writes use
  `randomUUID()`), so stale-image bugs cannot occur.
- If you ever need a manual purge (e.g. a mistaken upload), use the Cloudflare
  dashboard → Caching → Purge by URL. This repo never calls the purge API.

---

## 6. Nginx deployment instructions

The repo templates live in `deploy/nginx/`. The live server is Certbot-managed
and diverges, so **apply additively — do not blindly overwrite live vhosts.**

```bash
# 0. Back up the whole live config first
sudo cp -a /etc/nginx /etc/nginx.bak.$(date +%Y%m%d%H%M%S)

# 1. Install the shared snippets (new files — safe)
sudo mkdir -p /etc/nginx/snippets
sudo cp deploy/nginx/snippets/uploads-cache.conf        /etc/nginx/snippets/
sudo cp deploy/nginx/snippets/cloudflare-real-ip.conf   /etc/nginx/snippets/

# 2. In /etc/nginx/nginx.conf http{} block, add ONCE (near the other maps):
#      map $uri $upload_content_disposition {
#          default          "";
#          ~*\.(svgz?|html?|xht|xhtml|xml)$  "attachment";
#      }
#      include /etc/nginx/snippets/cloudflare-real-ip.conf;

# 3. In the api.jebdekho.com server block, replace the /uploads/ location body:
#      location /uploads/ {
#          alias /var/www/jebdekho/uploads/;
#          include /etc/nginx/snippets/uploads-cache.conf;
#          add_header Content-Disposition $upload_content_disposition always;
#      }

# 4. Validate BEFORE reloading
sudo nginx -t

# 5. Only if step 4 passed — graceful reload (no dropped connections)
sudo nginx -s reload
```

Request-size limits (`client_max_body_size`) and API timeouts are **unchanged**.

---

## 7. Updating the official Cloudflare IP ranges

The real-IP include ships with a committed copy of Cloudflare's ranges. Refresh
it whenever Cloudflare updates its list:

```bash
# Generate into the repo (validated, no reload):
pnpm cdn:update-ips
# Or write straight to the live path and validate:
sudo OUTPUT=/etc/nginx/snippets/cloudflare-real-ip.conf \
  bash deploy/scripts/update-cloudflare-ips.sh
# Apply after it passes nginx -t:
sudo nginx -s reload        # or add --reload to the command above
```

The script pulls only from `cloudflare.com/ips-v4` + `/ips-v6`, validates the
output is non-empty CIDR data, backs up the existing file, runs `nginx -t`, and
**restores the backup on failure**. It never reloads unless you pass `--reload`.

---

## 8. Preflight command

```bash
pnpm cdn:preflight                     # read-only readiness report
NODE_ENV=production pnpm cdn:preflight  # strict production checks
```

Prints `PASS / WARN / FAIL` per check with remediation text. It never touches
DNS, Cloudflare APIs, the database, or creates orders/payments. Exit code is
non-zero only on `FAIL`.

---

## 9. Rollback

Everything is additive and reversible.

```bash
# Nginx: restore the pre-change config and reload
sudo rm -f /etc/nginx/snippets/uploads-cache.conf /etc/nginx/snippets/cloudflare-real-ip.conf
sudo cp -a /etc/nginx.bak.<timestamp>/. /etc/nginx/
sudo nginx -t && sudo nginx -s reload

# App/env: unset the optional CDN var (empty already = legacy behaviour)
#   CDN_PUBLIC_URL=            # in .env.production, then reload the API only:
pm2 reload jebdekho-api

# Code: revert the branch changes
git revert <commit>   # or git checkout -- <files>
```

Cloudflare-side rollback: set the affected DNS records back to **DNS-only**
(grey cloud) in the dashboard — traffic then bypasses the CDN instantly.

---

## 10. Manual Cloudflare dashboard tasks (YOU do these — not automated)

- [ ] Add `jebdekho.com` to the Cloudflare **Free** plan.
- [ ] Change registrar **nameservers** to the Cloudflare-assigned pair.
- [ ] Confirm all DNS records imported correctly.
- [ ] Set website records (`@`, `www`, `api`, `merchant`, `admin`, `rider`,
      `vendor`, `franchise`) to **Proxied** (orange cloud).
- [ ] Keep **mail-related** records (MX, mail, SPF/DKIM hosts) **DNS-only** (grey).
- [ ] Set **SSL/TLS** mode to **Full (strict)** — origin has valid Let's Encrypt certs.
- [ ] Enable **Always Use HTTPS**.
- [ ] Enable **Automatic HTTPS Rewrites**.
- [ ] Review **cache rules** — a **Bypass** rule for `*/api/*` and any auth/cart/
      checkout/payment/order/webhook path; let `/uploads/*` and `/_next/static/*`
      cache.
- [ ] Do **not** cache HTML on authenticated subdomains (merchant/admin/rider/
      vendor/franchise) — add a Bypass rule if needed.
- [ ] Review **WAF / security** settings.
- [ ] Enable **DNSSEC** only **after** the zone is active.
- [ ] Test **all** domains + health endpoints after activation.

> **Known limitation:** the CDN does not become active until you change
> nameservers and enable the orange-cloud proxy. Until then these repo/VPS
> changes are dormant and the site behaves exactly as before.
