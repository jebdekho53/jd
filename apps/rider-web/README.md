# Rider BFF

Mobile API gateway for `@jebdekho/rider-mobile`.

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
