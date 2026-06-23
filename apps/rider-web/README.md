# Rider BFF

Mobile API gateway for `@jebdekho/rider-mobile`.

- Dev: `pnpm --filter @jebdekho/rider-web dev` (port **3004**)
- Mobile env: `EXPO_PUBLIC_BFF_URL=http://localhost:3004`

All `/api/rider/*` routes proxy to `/api/v1/rider/*` on the NestJS API.
