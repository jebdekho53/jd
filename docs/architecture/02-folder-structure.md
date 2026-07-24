# Jebdekho — Folder Structure

Monorepo using **pnpm workspaces** (recommended) or npm workspaces. Turborepo optional for build orchestration.

---

## Root Layout

```
jebdekho/
├── .github/
│   └── workflows/
│       ├── ci-api.yml
│       ├── ci-web.yml
│       └── deploy.yml
├── apps/
│   ├── api/                          # NestJS backend
│   ├── buyer-web/                    # Next.js — customer app
│   ├── merchant-web/                 # Next.js — merchant dashboard
│   ├── rider-web/                    # Next.js — rider BFF + captain PWA
│   └── admin-web/                    # Next.js — super admin
├── packages/
│   ├── shared-types/                 # DTOs, enums, API contracts
│   ├── ui/                           # Shared Shadcn components
│   ├── eslint-config/                # Shared ESLint
│   └── tsconfig/                     # Shared TypeScript configs
├── prisma/
│   ├── schema.prisma                 # Single source of truth
│   ├── migrations/
│   └── seed.ts
├── docker/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       ├── api.conf
│   │       ├── buyer.conf
│   │       ├── merchant.conf
│   │       ├── rider.conf
│   │       └── admin.conf
│   ├── postgres/
│   │   └── init.sql                  # Extensions (uuid-ossp, optional postgis)
│   └── api/
│       └── Dockerfile
├── docs/
│   └── architecture/                 # This documentation set
├── scripts/
│   ├── seed-dev.sh
│   └── backup-db.sh
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## `apps/api` — NestJS Backend

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── permissions.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── permissions.guard.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/
│   ├── config/
│   │   ├── config.module.ts
│   │   └── env.validation.ts
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── rbac/
│   │   ├── buyers/
│   │   ├── merchants/
│   │   ├── stores/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── deliveries/
│   │   ├── riders/
│   │   ├── reviews/
│   │   ├── wishlist/
│   │   ├── coupons/
│   │   ├── admin/
│   │   ├── geo/
│   │   ├── uploads/
│   │   ├── notifications/
│   │   └── websocket/
│   └── integrations/
│       ├── razorpay/
│       ├── maps/
│       └── sms/
├── test/
│   ├── e2e/
│   └── unit/
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── Dockerfile
```

---

## `apps/buyer-web` — Customer App

```
apps/buyer-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Home / discovery
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-otp/
│   │   ├── stores/
│   │   │   └── [storeId]/
│   │   ├── products/
│   │   │   └── [productId]/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   │   └── [orderId]/              # Live tracking
│   │   ├── wishlist/
│   │   └── profile/
│   ├── components/
│   │   ├── ui/                         # Shadcn (or import from packages/ui)
│   │   ├── layout/
│   │   ├── store/
│   │   ├── product/
│   │   ├── cart/
│   │   └── order/
│   ├── hooks/
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── websocket.ts
│   ├── stores/                         # Zustand
│   │   ├── auth.store.ts
│   │   ├── cart.store.ts
│   │   └── location.store.ts
│   └── providers/
│       ├── query-provider.tsx
│       └── auth-provider.tsx
├── public/
├── next.config.ts
├── tailwind.config.ts
├── components.json                     # Shadcn config
└── package.json
```

---

## `apps/merchant-web` — Merchant Dashboard

```
apps/merchant-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── stores/
│   │   │   ├── new/
│   │   │   └── [storeId]/
│   │   │       ├── settings/
│   │   │       ├── products/
│   │   │       ├── inventory/
│   │   │       ├── orders/
│   │   │       └── analytics/
│   │   └── onboarding/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── stores/
└── package.json
```

---

## `apps/rider-web` — Rider BFF + Captain PWA

```
apps/rider-web/
├── app/
│   ├── api/                      # BFF: proxies /api/rider/* → NestJS /rider/*
│   ├── login/  onboarding/       # OTP sign-in, signup, application status
│   ├── home/ orders/ earnings/   # Captain tabs (render features/rider/rider-home)
│   ├── cod/ shifts/ kyc/         # Dedicated captain pages
│   ├── fleet/ incentives/ training/ notifications/
│   ├── account/                  # edit, security, bank
│   ├── about/ help/ faq/ contact/ payouts/ privacy/ data-deletion/ agreement/
│   ├── offline/                  # PWA fallback
│   └── sw.ts                     # Serwist service worker
├── features/                     # rider/, auth/, fleet/, public/, pwa/
├── design-system/                # primitives, bottom-nav
└── lib/                          # typed api client, auth/session, transforms
```

**Why a PWA, not React Native:** the Expo app (`apps/rider-mobile`) was removed on
2026-07-23 — it had fallen far behind the PWA and was never deployed. The
trade-off that follows: background GPS only runs while the PWA is open, and there
is no rider push channel yet (`modules/push` is buyer-only).

---

## `apps/admin-web` — Super Admin

```
apps/admin-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── merchants/
│   │   ├── riders/
│   │   ├── orders/
│   │   ├── coupons/
│   │   ├── analytics/
│   │   └── settings/
│   ├── components/
│   ├── lib/
│   └── stores/
└── package.json
```

---

## `packages/shared-types`

```
packages/shared-types/
├── src/
│   ├── index.ts
│   ├── enums/
│   │   ├── order-status.ts
│   │   ├── user-role.ts
│   │   └── payment-status.ts
│   ├── dto/
│   └── api/
│       └── responses.ts
├── package.json
└── tsconfig.json
```

---

## `packages/ui`

```
packages/ui/
├── src/
│   ├── components/                     # Button, Card, Dialog, etc.
│   ├── hooks/
│   └── lib/
│       └── utils.ts
├── package.json
└── tsconfig.json
```

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `order.service.ts` |
| Classes | PascalCase | `OrderService` |
| DB tables | snake_case (Prisma `@@map`) | `order_items` |
| API routes | kebab-case plural | `/api/v1/order-items` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |
| React components | PascalCase | `StoreCard.tsx` |

---

## Placeholder Directories (Phase 1)

The following `.gitkeep` files mark future app roots until scaffolding:

- `apps/api/.gitkeep`
- `apps/buyer-web/.gitkeep`
- `apps/merchant-web/.gitkeep`
- `apps/rider-web/.gitkeep`
- `apps/admin-web/.gitkeep`
- `packages/shared-types/.gitkeep`
- `packages/ui/.gitkeep`
