# Rider Web — BFF + Captain PWA

This app serves **two** roles:

1. **BFF / API gateway** for `@jebdekho/rider-mobile` — `/api/rider/*` routes proxy
   to the NestJS API (`/rider/*`), including the delivery-handover OTP verify routes
   (`/api/rider/orders/[id]/verify-pickup`, `.../verify-delivery`).
2. **Captain PWA** — an authenticated rider web UI (`features/rider/rider-home.tsx`)
   with the active-delivery flow, pickup/delivery OTP entry, KYC, shifts, earnings,
   COD and support.

Canonical rider/delivery status: [../../docs/RIDER_DELIVERY_STATUS.md](../../docs/RIDER_DELIVERY_STATUS.md).

- Dev: `pnpm --filter @jebdekho/rider-web dev` (port **3004**)
- Home: http://localhost:3004 — BFF status & route reference
- Mobile env: `EXPO_PUBLIC_BFF_URL=http://localhost:3004`

## Local ports

| App | Port |
|-----|------|
| Buyer | 3000 |
| Merchant | 3002 |
| Admin | **3003** |
| Rider BFF | **3004** |
| API | 3001 |

All `/api/rider/*` routes proxy to `/api/v1/rider/*` on the NestJS API.
