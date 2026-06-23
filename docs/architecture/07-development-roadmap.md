# Jebdekho — Development Roadmap

## Overview

Phased delivery over **~24 weeks** for a production MVP with four apps, scalable backend, and VPS deployment. Timelines assume a small team (2–4 engineers); adjust for team size.

---

## Phase 0: Architecture & Foundation (Week 1) ✅ Current

**Deliverables:**
- [x] System architecture document
- [x] Folder structure
- [x] PostgreSQL / Prisma schema design
- [x] Auth & RBAC design
- [x] Docker Compose (dev)
- [x] Environment variable structure
- [x] API versioning strategy
- [ ] **Approval gate** — no app code until signed off

---

## Phase 1: Core Infrastructure (Weeks 2–3)

**Goal:** Runnable monorepo with auth working end-to-end.

| Task | Output |
|------|--------|
| Initialize pnpm monorepo + Turborepo | Root `package.json`, workspace config |
| Scaffold NestJS API | `apps/api` with config, Prisma, health checks |
| Run Prisma migrations + seed roles/permissions | Working DB |
| Implement Auth module | Register, login, OTP, refresh, logout |
| Implement RBAC guards | Roles + permissions |
| Redis integration | Session cache, rate limiting |
| Scaffold buyer-web (Next.js) | Auth pages, API client, React Query |
| Unit tests: AuthService, TokenService | 80%+ on auth |
| CI: lint + test on PR | GitHub Actions |

**Exit criteria:** Buyer can register, verify OTP, login, call `/auth/me`.

---

## Phase 2: Geography & Store Discovery (Weeks 4–5)

**Goal:** Buyer finds nearby stores.

| Task | Output |
|------|--------|
| Cities & zones admin seed + API | `geo` module |
| Store CRUD (merchant) | Store onboarding flow |
| Store hours, settings | Merchant dashboard pages |
| Nearby store query (lat/lng + zone) | Redis-cached discovery |
| Buyer home page | Store listing, location picker |
| Google Maps integration | Address autocomplete, map picker |
| Scaffold merchant-web | Store management UI |

**Exit criteria:** Merchant creates store; buyer sees it when nearby.

---

## Phase 3: Catalog & Inventory (Weeks 6–7)

**Goal:** Full product management and browsing.

| Task | Output |
|------|--------|
| Categories (hierarchical) | Admin + merchant CRUD |
| Products + variants | Merchant product UI |
| Inventory tracking + reservation logic | Stock management |
| Product listing & detail (buyer) | Search, filters, skeleton loaders |
| Image upload (MinIO/R2 presigned) | Product images |
| Full-text search (PostgreSQL trgm) | `/products/search` |

**Exit criteria:** Merchant adds products; buyer browses and searches within a store.

---

## Phase 4: Cart & Checkout (Weeks 8–9)

**Goal:** Buyer can place a paid order.

| Task | Output |
|------|--------|
| Cart module (per store) | Add/update/remove items |
| Checkout flow | Address, coupon, order summary |
| Order creation + status machine | `orders` module |
| Razorpay integration | Payment + webhook |
| Order confirmation UI | Buyer order detail page |
| Merchant order inbox | Accept/reject/prepare flow |
| E2E test: full checkout | Playwright |

**Exit criteria:** End-to-end order with successful Razorpay payment (test mode).

---

## Phase 5: Delivery & Rider App (Weeks 10–12)

**Goal:** Rider delivers orders with live tracking.

| Task | Output |
|------|--------|
| Rider registration + admin approval | Rider onboarding |
| Online/offline status | Redis GEO |
| Assignment algorithm | Nearest rider offer + timeout |
| Scaffold rider-web (PWA) | Mobile-first UI |
| Live location updates | WebSocket + `rider_locations` |
| Buyer order tracking map | Real-time rider marker |
| Delivery confirmation + proof | Photo optional (Phase 5.1) |
| Earnings dashboard (basic) | Rider earnings page |

**Exit criteria:** Order flows from merchant ready → rider delivers → buyer sees live map.

---

## Phase 6: Admin Dashboard (Weeks 13–14)

**Goal:** Platform operators manage the marketplace.

| Task | Output |
|------|--------|
| Scaffold admin-web | Dashboard layout |
| User/merchant/rider management | CRUD + suspend |
| Order monitoring | Platform-wide order list |
| Coupon management | Create/deactivate coupons |
| Revenue analytics (basic) | Charts: GMV, orders/day |
| Platform settings | Delivery fee, min order |
| Rider approval workflow | Document review UI |

**Exit criteria:** Admin can onboard city, approve rider, monitor orders.

---

## Phase 7: Reviews, Wishlist & Polish (Weeks 15–16)

**Goal:** Buyer engagement features + UX quality.

| Task | Output |
|------|--------|
| Reviews & ratings | Post-delivery review |
| Wishlist | Save products |
| Notification module | In-app + push prep |
| Empty/error/skeleton states | All apps |
| Performance audit | Lighthouse mobile ≥ 90 buyer app |
| Accessibility pass | WCAG 2.1 AA basics |

---

## Phase 8: Production Hardening (Weeks 17–18)

**Goal:** Production-ready deployment.

| Task | Output |
|------|--------|
| Docker production images | Multi-stage builds |
| Nginx reverse proxy config | SSL termination |
| Cloudflare setup | CDN, WAF, DNS |
| Database backups | Automated daily |
| Logging + error tracking | Pino + Sentry |
| Load testing | k6 baseline (100 concurrent checkouts) |
| Security review | OWASP top 10 checklist |
| Documentation | Runbooks, API docs |

**Exit criteria:** Deployed on VPS; investor demo ready.

---

## Phase 9: Scale Prep (Weeks 19–24) — Post-MVP

| Initiative | Priority |
|------------|----------|
| PostGIS for geospatial | High |
| Elasticsearch product search | Medium |
| Merchant staff roles | Medium |
| Push notifications (FCM) | High |
| React Native rider app | Medium |
| Order table partitioning | High at volume |
| Read replicas | Medium |
| Analytics pipeline (ClickHouse/BQ) | Low |

---

## Milestone Summary

| Milestone | Week | Demo |
|-----------|------|------|
| M0: Architecture approved | 1 | Design review |
| M1: Auth live | 3 | Login/register demo |
| M2: Discovery | 5 | Find stores on map |
| M3: Catalog | 7 | Browse products |
| M4: First order | 9 | Paid checkout |
| M5: Delivery | 12 | Live tracking |
| M6: Admin | 14 | Platform dashboard |
| M7: MVP | 18 | Full investor demo |

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Razorpay webhook reliability | Idempotency + retry queue |
| Inventory race conditions | Optimistic locking + reservation TTL |
| Rider assignment failures | Manual admin assignment fallback |
| Geospatial performance | PostGIS migration path documented |
| Scope creep | Strict phase gates; defer Phase 9 items |

---

## Team Allocation (Suggested)

| Role | Phase 1–4 | Phase 5–8 |
|------|-----------|-----------|
| Backend | Auth, orders, payments | Deliveries, WebSocket |
| Frontend (Buyer) | Discovery, cart, checkout | Tracking, polish |
| Frontend (Merchant/Admin) | Store, products | Admin, analytics |
| Full-stack / Rider | — | Rider app, assignment |
| DevOps | Docker, CI | Production deploy |

---

## Next Action

**Review Phase 0 deliverables and approve** to begin Phase 1 scaffolding.

Questions to resolve at approval:
1. Primary launch city?
2. PWA vs native rider app for MVP?
3. SMS OTP provider (MSG91, Twilio, AWS SNS)?
4. Single VPS size for MVP (4GB vs 8GB RAM)?
