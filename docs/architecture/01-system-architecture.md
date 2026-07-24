# Jebdekho — System Architecture

## 1. Executive Summary

Jebdekho is a **multi-vendor hyperlocal marketplace** connecting buyers, merchants, and riders within city-scoped service areas. Four client applications share one **NestJS API**, one **PostgreSQL** database, **Redis** for cache/sessions/pub-sub, and **WebSockets** for real-time order and delivery tracking.

Design goals: horizontal scalability, strict RBAC, geographic query performance, and independent merchant operations at thousands-of-stores scale.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Cloudflare (CDN, WAF, DNS)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  Nginx (VPS) │  │  Nginx (VPS) │  │  Nginx (VPS) │
            │  buyer.*     │  │ merchant.*   │  │  admin.*     │
            └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                   │                 │                 │
         Next.js   │       Next.js   │       Next.js   │
         Buyer App│       Merchant  │       Admin App │
                   │                 │                 │
                   └─────────────────┼─────────────────┘
                                     │
                              HTTPS / WSS
                                     ▼
                    ┌────────────────────────────────┐
                    │     NestJS API (apps/api)      │
                    │  ┌──────────┐  ┌────────────┐  │
                    │  │ REST v1  │  │ WebSocket  │  │
                    │  │ /api/v1  │  │ Gateway    │  │
                    │  └──────────┘  └────────────┘  │
                    └───────────┬────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
  │ PostgreSQL  │        │    Redis    │        │ R2 / MinIO  │
  │  (Primary)  │        │ Cache/PubSub│        │   Storage   │
  └─────────────┘        └─────────────┘        └─────────────┘
         │
         ▼
  External: Razorpay · Google Maps · SMS/Email OTP
```

---

## 3. Application Boundaries

| App | Users | Primary Domain | Auth Role |
|-----|-------|----------------|-----------|
| **Buyer** (`apps/buyer-web`) | End customers | Discovery, cart, checkout, tracking | `BUYER` |
| **Merchant** (`apps/merchant-web`) | Store owners/staff | Catalog, inventory, orders, analytics | `MERCHANT` |
| **Rider** (`apps/rider-web`) | Delivery partners | Assignment, navigation, earnings | `RIDER` |
| **Admin** (`apps/admin-web`) | Platform operators | Users, merchants, riders, platform config | `ADMIN` |
| **API** (`apps/api`) | All clients | Business logic, persistence, integrations | — |

All clients consume **`/api/v1/*`** REST endpoints. Real-time channels use **`/ws`** with JWT handshake.

---

## 4. Backend Module Architecture (NestJS)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/                    # Guards, filters, interceptors, pipes
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── permissions.guard.ts
│   ├── decorators/
│   └── filters/
├── config/                    # Env validation (class-validator)
├── database/                  # Prisma service
├── modules/
│   ├── auth/                  # Login, register, OTP, refresh
│   ├── users/
│   ├── rbac/
│   ├── buyers/
│   ├── merchants/
│   ├── stores/
│   ├── products/
│   ├── inventory/
│   ├── orders/
│   ├── cart/
│   ├── payments/              # Razorpay webhooks
│   ├── deliveries/
│   ├── riders/
│   ├── reviews/
│   ├── coupons/
│   ├── admin/
│   ├── notifications/
│   ├── uploads/               # R2/MinIO presigned URLs
│   ├── geo/                   # Nearby stores, zones
│   └── websocket/             # Order + rider location events
└── integrations/
    ├── razorpay/
    ├── maps/
    └── sms/
```

Each module follows **Controller → Service → Repository (Prisma)** with DTO validation via `class-validator`.

---

## 5. Core Domain Flows

### 5.1 Order Lifecycle

```
CREATED → PAYMENT_PENDING → PAID → MERCHANT_ACCEPTED → PREPARING
  → READY_FOR_PICKUP → RIDER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY
  → DELIVERED → COMPLETED

Cancellation branches: CANCELLED_BY_BUYER | CANCELLED_BY_MERCHANT | CANCELLED_BY_ADMIN
Failure branches: PAYMENT_FAILED | DELIVERY_FAILED
```

State transitions are **append-only** in `OrderStatusHistory` for auditability. WebSocket events broadcast on every transition.

### 5.2 Store Discovery (Hyperlocal)

1. Buyer shares GPS or selects saved address.
2. API resolves `(lat, lng)` → `ServiceArea` → `Zone` → `City` (Delhi NCR launch).
3. Query **APPROVED** stores in zone via `store_zones`; optional `store_service_areas` filter.
4. Redis caches zone→store list (TTL 60s); invalidate on store/product changes.

**Scale note:** PostGIS (`ST_DWithin`) upgrade path documented; NCR seeded with zones + service areas.

### 5.3 Rider Assignment

1. Order reaches `READY_FOR_PICKUP`.
2. Assignment service finds online riders in zone (Redis GEO + DB fallback).
3. Push assignment to nearest rider; timeout → next rider (configurable).
4. Rider accepts → `RIDER_ASSIGNED`; live location streamed via WebSocket.

### 5.4 Payment Flow

**Razorpay:**
1. Create Razorpay order on checkout (`payment_method: RAZORPAY`).
2. Client completes payment.
3. Webhook verifies signature → `payment_status: PAID` + domain event `PAYMENT_COMPLETED`.
4. Idempotency key on webhook handler prevents duplicate processing.

**COD (Day 1):**
1. Order created with `payment_method: COD`, `payment_status: PENDING`.
2. Order proceeds without online payment.
3. Rider collects cash on delivery → `payment_status: PAID` + `PAYMENT_COMPLETED` event.

---

## 6. Multi-Tenancy Model

| Layer | Isolation Strategy |
|-------|-------------------|
| **Merchant data** | Store-scoped; **admin approval required** before store visible (`APPROVED` status) |
| **Buyer data** | Scoped by `buyerId`; no cross-buyer access |
| **Rider data** | Scoped by `riderId`; zone-mapped via `rider_zones` |
| **Admin** | Platform-wide read; all mutations → `audit_logs` |
| **Geography** | Delhi NCR → zones → service areas; indexed by `cityId`, `zoneId` |

**No shared mutable state between merchants.** Platform coupons and settings are admin-owned.

---

## 7. Caching Strategy (Redis)

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `session:{userId}` | Active session metadata | 7d |
| `refresh:{tokenHash}` | Refresh token rotation | 30d |
| `otp:{phone}` | OTP rate limit + code | 5m |
| `zone:stores:{zoneId}` | Nearby store list | 60s |
| `product:{id}` | Hot product detail | 5m |
| `cart:{buyerId}` | Optional cart cache | 24h |
| `rider:online:{zoneId}` | GEO set of online riders | — |
| `rate:{ip}:{endpoint}` | Rate limiting | 1m |

Pub/Sub channels: `order:{orderId}`, `rider:{riderId}`, `store:{storeId}` for WebSocket fan-out across API instances.

---

## 8. Real-Time Architecture

- **Socket.io** (or `@nestjs/websockets`) behind Nginx sticky sessions or Redis adapter.
- Rooms: `buyer:{id}`, `merchant:{storeId}`, `rider:{id}`, `order:{id}`, `admin:orders`.
- Events: `order.status`, `rider.location`, `assignment.offer`, `assignment.expired`.

---

## 9. Security Architecture

| Concern | Implementation |
|---------|----------------|
| Authentication | JWT RS256 access (15m) + refresh (30d, rotated, stored hashed) |
| Authorization | RBAC: roles + granular permissions per module |
| API | Helmet, CORS allowlist, rate limiting, input validation |
| Secrets | Env vars only; never in repo |
| Uploads | Presigned URLs; virus scan hook (future) |
| Payments | Razorpay webhook signature verification |
| Data | Row-level scoping in services; no trust in client `storeId` |

---

## 10. Observability (Production)

- Structured JSON logging (Pino)
- Health checks: `/api/v1/health`, `/api/v1/health/ready`
- Metrics: Prometheus-compatible (future)
- Error tracking: Sentry (future)

---

## 11. Scalability Path

| Phase | Scale | Actions |
|-------|-------|---------|
| **MVP** | Single VPS, 1 API instance | Docker Compose, connection pooling |
| **Growth** | 2–4 API instances | Redis adapter, read replicas |
| **Scale** | Multi-city, 10k+ stores | PostGIS, partition orders by month, CDN for assets |
| **Enterprise** | Millions of products | Elasticsearch for search, CQRS for analytics |

---

## 12. Approval Checklist

Before Phase 1 implementation, confirm:

- [ ] Monorepo structure acceptable
- [x] Prisma schema covers all modules (v2: events, audit, service areas, search index)
- [x] RBAC model matches operational needs
- [x] Order state machine matches business rules
- [x] Store approval workflow (admin mandatory)
- [x] COD + Razorpay payment model
- [x] RS256 JWT from day one
- [x] Rider app: React Native (Expo)
- [x] Launch city: Delhi NCR
- [ ] Deployment target (single VPS vs multi-node)

**Next step:** Phase 1 — NestJS scaffold, Auth module, Prisma migrate + seed.
