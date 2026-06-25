# Per-app production environment templates
# Copy to VPS alongside root `.env.production` before build.

## buyer-web (`apps/buyer-web/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.jebdekho.com/api/v1
NEXT_PUBLIC_API_ORIGIN=https://api.jebdekho.com
NEXT_PUBLIC_WS_URL=wss://api.jebdekho.com
NEXT_PUBLIC_SITE_URL=https://jebdekho.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## admin-web (`apps/admin-web/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.jebdekho.com/api/v1
NEXT_PUBLIC_API_ORIGIN=https://api.jebdekho.com
NEXT_PUBLIC_APP_URL=https://admin.jebdekho.com
```

## merchant-web (`apps/merchant-web/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.jebdekho.com/api/v1
NEXT_PUBLIC_API_ORIGIN=https://api.jebdekho.com
NEXT_PUBLIC_APP_URL=https://merchant.jebdekho.com
```

## rider-web (`apps/rider-web/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.jebdekho.com/api/v1
NEXT_PUBLIC_API_ORIGIN=https://api.jebdekho.com
NEXT_PUBLIC_APP_URL=https://rider.jebdekho.com
```

## vendor-web (`apps/vendor-web/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.jebdekho.com/api/v1
NEXT_PUBLIC_API_ORIGIN=https://api.jebdekho.com
NEXT_PUBLIC_APP_URL=https://vendor.jebdekho.com
```

## franchise-web (`apps/franchise-web/.env.production`)

```env
NEXT_PUBLIC_API_URL=https://api.jebdekho.com/api/v1
NEXT_PUBLIC_API_ORIGIN=https://api.jebdekho.com
NEXT_PUBLIC_APP_URL=https://franchise.jebdekho.com
```

## API

API reads from root `/var/www/jebdekho/.env.production` — see `.env.production.example` at repo root.

`deploy/scripts/build-production.sh` exports these automatically during CI/CD builds.
