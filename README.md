# Jebdekho

Production-grade hyperlocal commerce platform — multi-vendor marketplace with buyer, merchant, rider, and admin systems.

## Status

**Phase 0: Architecture v2** — Review changes incorporated. **Phase 1 ready.**

## Confirmed Stack Decisions

| Item | Choice |
|------|--------|
| Launch | Delhi NCR |
| Rider app | React Native (Expo) |
| Web apps | Next.js (Buyer, Merchant, Admin) |
| Auth | JWT **RS256** + refresh rotation |
| SMS | MSG91 |
| Payments | Razorpay + **COD** |
| Stores | Admin approval required |

## Documentation

| Document | Description |
|----------|-------------|
| [Approval Package v2](docs/architecture/00-approval-package.md) | Decisions + Phase 1 scope |
| [Architecture Overview](docs/architecture/01-system-architecture.md) | System design |
| [Database Design](docs/architecture/03-database-design.md) | 47-table schema |
| [Store Approval](docs/architecture/09-store-approval-workflow.md) | Merchant → admin workflow |
| [Events & Search](docs/architecture/10-events-notifications-search.md) | domain_events, FTS, notifications |
| [Development Roadmap](docs/architecture/07-development-roadmap.md) | Phased delivery |

## v2 Schema Additions

- `service_areas`, `store_service_areas` — NCR geo hierarchy
- `domain_events` — analytics & notification triggers
- `audit_logs` — admin action trail
- `notification_templates`, `notification_deliveries` — MSG91/SMS/email/push
- `product_search_index` — PostgreSQL FTS (no LIKE at scale)
- `orders.payment_method` / `payment_status` — COD + Razorpay

## Quick Start (Phase 1)

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
```

## Tech Stack

- **Frontend:** Next.js, React Native (Expo), TypeScript, TailwindCSS, Shadcn UI
- **Backend:** NestJS, Prisma, PostgreSQL, Redis, WebSockets
- **Infra:** Docker, Nginx, Cloudflare, MinIO → R2, Razorpay, Google Maps, MSG91
