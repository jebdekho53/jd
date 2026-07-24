# JebDekho

Production-grade hyperlocal, multi-vendor commerce platform operated by
**Urbanmove Services Private Limited**. Local stores, restaurants, grocery,
fashion, electronics, bakery and personal care — with buyer, merchant, rider and
admin systems, first-party (own-fleet) delivery, and third-party logistics.

- **Launch region:** Delhi NCR
- **Architecture:** pnpm + Turborepo monorepo — NestJS API, Prisma/PostgreSQL,
  Redis, Next.js web apps, Expo React Native rider app.

> **Status is tracked per application/domain — there is no single "%" for the whole
> product.** For the rider/delivery domain (the most active area), the canonical,
> evidence-based status document is
> **[docs/RIDER_DELIVERY_STATUS.md](docs/RIDER_DELIVERY_STATUS.md)**.

## Application status

Status labels: **COMPLETE** · **MOSTLY COMPLETE** · **PARTIAL** · **NOT STARTED** ·
**BLOCKED** (external dependency) · **NEEDS VERIFICATION**.

| App | Port | Purpose | Status | Notable remaining work |
|-----|------|---------|--------|------------------------|
| `apps/api` | 3001 | NestJS monolith API (303 Prisma models, Redis, RS256 JWT + RBAC) | **COMPLETE** | Phone OTP (MSG91) disabled in prod; E2E harness |
| `apps/buyer-web` | 3000 | Customer storefront, checkout, order tracking | **MOSTLY COMPLETE** | Staging E2E of live delivery/OTP |
| `apps/merchant-web` | 3002 | Merchant dashboard, order & handover ops | **MOSTLY COMPLETE** | Return-to-store UI (no backend yet) |
| `apps/admin-web` | 3003 | Platform admin & rider operations | **MOSTLY COMPLETE** | Some dispatch controls need verification |
| `apps/rider-web` | 3004 | Rider **BFF** (`/api/rider/*`) **and** captain **PWA** UI | **MOSTLY COMPLETE** | Device/staging validation of OTP flow |
| `apps/vendor-web` | 3005 | Vendor / procurement portal | **PARTIAL** | Basic pages |
| `apps/franchise-web` | 3006 | Franchise territory portal (real Razorpay Route payouts) | **PARTIAL** | Ongoing |

**Auth:** email + password / email OTP is the production path; phone OTP (MSG91)
is implemented but disabled (`AUTH_PHONE_OTP_ENABLED=false`). JWT RS256 + refresh
rotation + RBAC across all roles.

## Rider & delivery

The rider/delivery **backend domain is production-grade and largely COMPLETE**; the
user-facing OTP handover flow is wired end-to-end and covered by tests. The gating
work before a pilot is **validation, not code**. Full detail:
**[docs/RIDER_DELIVERY_STATUS.md](docs/RIDER_DELIVERY_STATUS.md)**.

- **Provider-neutral logistics** — registry + orchestrator; adapters implement one
  interface. **Shadowfax** is the real integration (BLOCKED on production
  credentials); **Borzo** adapter exists (NEEDS VERIFICATION against the live
  provider); **Porter/Delhivery are stubs** (NOT STARTED).
- **Own fleet** — in-house rider assignment (`RiderAssignmentService`) with
  race-safe offers; the `OwnFleetProvider` adapter is a health-check placeholder by
  design. **COMPLETE.**
- **Delivery state machine + OTP handover** — server-side transitions; pickup &
  delivery OTP generation/verification with attempt-limiting, audit, one-time use;
  **COD cash-acknowledgment gate** (amount is server-authoritative). OTPs are
  sanitized out of rider/generic payloads. **COMPLETE** (backend).
- **OTP UI** — buyer delivery-OTP card, merchant pickup-OTP banner, and rider-web
  captain OTP entry (with COD acknowledgment). **MOSTLY COMPLETE**
  (pending staging validation).
- **COD reconciliation, rider earnings/payouts (Razorpay Route), live location &
  ETA, authenticated/scoped WebSocket events, admin rider/captain ops** — implemented.
- **Not yet done:** return-to-store workflow (**NOT STARTED**), rider push
  notifications (no rider subscription endpoint exists — `modules/push` is
  buyer-only), staging E2E.

Legacy planning docs are retained for history:
[Development Roadmap](docs/architecture/07-development-roadmap.md) (superseded) and
[Feature Audit — 28 Jun 2026](docs/FEATURE_AUDIT_REPORT.md) (point-in-time).

## Tech stack

- **Frontend:** Next.js, React Native (Expo), TypeScript, TailwindCSS.
- **Backend:** NestJS, Prisma, PostgreSQL, Redis, Socket.IO/WebSockets, domain events.
- **Integrations:** Razorpay (+ Route) & COD, Google Maps, Shadowfax logistics,
  MSG91 (SMS), MinIO/R2 (uploads).
- **Infra:** Docker (dev), PM2 + Nginx + Cloudflare (prod VPS).

## Quick start (local)

```bash
cp .env.example .env
docker compose up -d          # PostgreSQL + Redis
pnpm install                  # runs prisma generate (postinstall)
pnpm db:migrate               # apply migrations (dev)
pnpm db:seed                  # seed baseline data
pnpm dev                      # dev:infra + all apps via Turbo
```

## Development & validation commands

Only commands that exist in package scripts (or verified `pnpm exec` invocations)
are listed.

**Database (root):**
```bash
pnpm db:generate                                  # prisma generate
pnpm exec prisma validate --schema=prisma/schema.prisma
pnpm db:migrate                                   # migrate dev
pnpm db:migrate:prod                              # migrate deploy (prod)
pnpm exec prisma migrate status --schema=prisma/schema.prisma
```

**API (`apps/api`):**
```bash
pnpm --filter @jebdekho/api exec tsc --noEmit     # typecheck (no dedicated script)
pnpm --filter @jebdekho/api test                  # jest unit tests
pnpm --filter @jebdekho/api run test:integration  # integration (jest-integration.json)
pnpm --filter @jebdekho/api run lint
```

**Web apps** (`buyer-web`, `merchant-web`, `admin-web`, `rider-web`):
```bash
pnpm --filter @jebdekho/<app> exec tsc --noEmit    # typecheck (no dedicated script)
pnpm --filter @jebdekho/<app> test                 # jest (buyer/merchant/admin/rider-web)
pnpm --filter @jebdekho/<app> run build            # next build
pnpm --filter @jebdekho/<app> run lint
```


> `vendor-web` and `franchise-web` expose `dev`/`build`/`lint` only (no `test`).

## Deployment — delivery-OTP migration warning

A **pending, unapplied** migration adds the delivery-handover OTP columns:
`prisma/migrations/20260808000100_delivery_handover_otp`. It is **backfill-free**
(all added `deliveries` columns are nullable/defaulted). Deploy in this order:

1. **Database migration** — `pnpm db:migrate:prod` (apply `20260808000100_delivery_handover_otp`).
2. **API** — deploy the new build (endpoints depend on the new columns).
3. **Web apps** — buyer, merchant, admin, rider-web (BFF + captain).
4. **Rider mobile** — only after device QA + Expo/FCM push credentials.
5. **Controlled pilot** — single zone, selected riders.
6. **Monitoring + rollback ready.**

See the [Go-Live Checklist](deploy/docs/GO_LIVE_CHECKLIST.md) and
[Production Verification](deploy/docs/PRODUCTION_VERIFICATION.md) for the full
infra sequence. Do not commit real secrets — use `.env.production`.

## Documentation

| Document | Description |
|----------|-------------|
| [Rider & Delivery Status](docs/RIDER_DELIVERY_STATUS.md) | **Canonical** rider/delivery status, checklists, estimates |
| [System Architecture](docs/architecture/01-system-architecture.md) | System design |
| [Database Design](docs/architecture/03-database-design.md) | Schema design (see live `prisma/schema.prisma` for current 303 models) |
| [Authentication](docs/architecture/04-authentication.md) · [RBAC](docs/architecture/05-rbac.md) | Auth & permissions |
| [Events, Notifications & Search](docs/architecture/10-events-notifications-search.md) | domain_events, notifications, FTS |
| [Development Roadmap](docs/architecture/07-development-roadmap.md) | Original phased plan (**historical / superseded**) |
| [Feature Audit](docs/FEATURE_AUDIT_REPORT.md) | Platform audit snapshot — **28 Jun 2026, point-in-time** |
| [Go-Live Checklist](deploy/docs/GO_LIVE_CHECKLIST.md) | Production deploy checklist |
