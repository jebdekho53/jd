# Phase 0 — Architecture Approval Package (v2)

Updated per production review. **Phase 1 approval conditions met.**

---

## Confirmed Decisions

| Item | Choice |
|------|--------|
| Launch City | **Delhi NCR** |
| Rider App | **React Native (Expo)** |
| SMS Provider | **MSG91** |
| COD | **Yes — Day 1** |
| Store Approval | **Admin mandatory** |
| JWT Algorithm | **RS256** |
| Buyer / Merchant / Admin | **Next.js** |
| Storage | **MinIO (dev) → Cloudflare R2 (prod)** |

---

## v2 Architecture Additions

| Addition | Location |
|----------|----------|
| `service_areas` + geo hierarchy | `prisma/schema.prisma`, [03-database-design.md](./03-database-design.md) |
| Store approval workflow | [09-store-approval-workflow.md](./09-store-approval-workflow.md) |
| `domain_events` | `prisma/schema.prisma`, [10-events-notifications-search.md](./10-events-notifications-search.md) |
| `audit_logs` | `prisma/schema.prisma` |
| `notification_templates` + `notification_deliveries` | `prisma/schema.prisma` |
| `product_search_index` + PostgreSQL FTS | [10-events-notifications-search.md](./10-events-notifications-search.md) |
| COD on orders | `orders.payment_method`, `orders.payment_status` |
| RS256 JWT | [04-authentication.md](./04-authentication.md), `.env.example` |

---

## Schema Statistics (v2)

| Category | Tables |
|----------|--------|
| Identity & RBAC | 7 |
| Profiles | 5 |
| Geography | 6 (+ `service_areas`, `store_service_areas`) |
| Stores & Catalog | 8 (+ `product_search_index`) |
| Cart & Wishlist | 3 |
| Orders & Payments | 5 |
| Delivery | 4 |
| Coupons & Reviews | 3 |
| Platform & Events | 6 (+ `domain_events`, `audit_logs`, templates, deliveries) |
| **Total** | **47 models** |

---

## Store Status (Updated)

```
DRAFT → PENDING_REVIEW → APPROVED
              ↓              ↓
          REJECTED      SUSPENDED
```

---

## Payment Model (Updated)

**On `orders`:**

| Field | Values |
|-------|--------|
| `payment_method` | `COD`, `RAZORPAY` |
| `payment_status` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |

---

## Phase 1 — Approved Scope

With v2 architecture in place, Phase 1 implementation begins:

1. NestJS monolith (`apps/api`)
2. Prisma migration + seed (Delhi NCR, roles, permissions, templates)
3. Auth module (RS256 JWT)
4. OTP login (MSG91)
5. RBAC guards
6. Refresh token rotation
7. Audit log interceptor (admin actions)
8. Domain event emitter (foundation)

**Not in Phase 1:** Buyer catalog UI, payments checkout, rider mobile app (Phase 5).

---

## Deliverable Index

| # | Document |
|---|----------|
| 1 | [System Architecture](./01-system-architecture.md) |
| 2 | [Folder Structure](./02-folder-structure.md) |
| 3 | [Database Design](./03-database-design.md) |
| 4 | [Authentication (RS256)](./04-authentication.md) |
| 5 | [RBAC](./05-rbac.md) |
| 6 | [API Versioning](./06-api-versioning.md) |
| 7 | [Development Roadmap](./07-development-roadmap.md) |
| 8 | [Deployment](./08-deployment.md) |
| 9 | [Store Approval Workflow](./09-store-approval-workflow.md) |
| 10 | [Events, Notifications, Search](./10-events-notifications-search.md) |

---

## Scale Target

This foundation supports **100k+ users** without architecture rewrite:

- Event-driven notifications & analytics hook
- FTS product search (millions of SKUs)
- Geographic partitioning (city → zone → service area)
- RS256 for future microservice split
- Audit trail for compliance & ops

**Status: Ready for Phase 1 implementation.**
