# JebDekho — Feature Audit Report

> ⚠️ **POINT-IN-TIME SNAPSHOT (28 Jun 2026), partly stale.** This audit predates
> the rider/captain completion and delivery-OTP work. In particular its rider
> claims are outdated: `rider-web` now hosts a **captain PWA UI** (not "BFF only"),
> `rider-mobile` has a full active-delivery + OTP flow (still pending device QA),
> and pickup/delivery **OTP handover is implemented** across API, rider apps,
> buyer and merchant. For current rider/delivery status use the canonical
> **[RIDER_DELIVERY_STATUS.md](RIDER_DELIVERY_STATUS.md)**. Other sections remain a
> useful platform snapshot but should be re-verified against current code.

**Generated:** 28 June 2026  
**Repository:** `jebdekho53/jd`  
**Latest commit:** `664be46` — *feat: merchant AI wallet billing, checkout payment sync, and dispatch on place*  
**Launch target:** Delhi NCR hyperlocal marketplace  

---

## 1. Executive summary

JebDekho is a **multi-portal hyperlocal commerce platform** with a NestJS API, PostgreSQL (252 Prisma models), Redis, and seven Next.js web apps plus an Expo rider mobile scaffold. The **core buyer → merchant → delivery loop is largely built** and deployable on a single VPS via `deploy/deploy.sh`.

| Area | Status |
|------|--------|
| Core commerce (browse, cart, checkout, orders) | ✅ **Completed** (production path) |
| Merchant catalog (manual, CSV, AI) | ✅ **Completed** |
| Merchant AI wallet (prepaid ₹1.50/confirm) | ✅ **Completed** (needs OpenAI + Razorpay on VPS) |
| Payments (COD + Razorpay) | ✅ **Completed** (live keys required) |
| Logistics (Shadowfax) | 🟡 **Partial** (integrated; credentials + webhook config on VPS) |
| Admin operations | ✅ **Completed** (broad dashboard) |
| Rider delivery | 🟡 **Partial** (API + mobile scaffold; rider-web is BFF only) |
| Phone OTP (MSG91) | 🔴 **Not live** (email auth in production) |
| Advanced / future modules (franchise, vendor, AI commerce) | 🟡 **Partial** (API + UI; not all production-critical) |
| Production hardening (E2E, Sentry, load test) | 🔴 **Remaining** |

**Legend:** ✅ Completed · 🟡 Partial / needs config or polish · 🔴 Not started or disabled · 📋 Planned (roadmap)

---

## 2. Applications inventory

| App | Port (prod) | Role | Status |
|-----|-------------|------|--------|
| `apps/api` | 3001 | NestJS monolith API | ✅ Running |
| `apps/buyer-web` | 3000 | Customer storefront + checkout | ✅ Running |
| `apps/merchant-web` | 3002 | Merchant dashboard | ✅ Running |
| `apps/admin-web` | 3003 | Platform admin | ✅ Running |
| `apps/rider-web` | 3004 | Rider **BFF / API gateway** (not full rider UI) | 🟡 BFF only |
| `apps/vendor-web` | 3005 | Vendor portal (procurement) | 🟡 Basic pages |
| `apps/franchise-web` | 3006 | Franchise territory portal | 🟡 Basic pages |
| `apps/rider-mobile` | — | Expo React Native rider app | 🟡 Scaffolded, not shipped |

**API modules:** 50+ domain modules (auth, cart, checkout, order, product, logistics, finance, CRM, etc.)  
**Unit tests:** ~95 spec files under `apps/api/src`  
**E2E tests:** None in repo (Playwright mentioned in roadmap only)

---

## 3. Feature matrix

### 3.1 Identity & authentication

| Feature | Buyer | Merchant | Admin | Rider | Status | Notes |
|---------|-------|----------|-------|-------|--------|-------|
| Email + password auth | ✅ | ✅ | ✅ | ✅ | ✅ Completed | Primary auth in production |
| Email OTP / verification | ✅ | ✅ | — | — | ✅ Completed | |
| Phone OTP (MSG91) | UI | UI | — | API | 🔴 Disabled | `AUTH_PHONE_OTP_ENABLED=false`; "Coming soon" in UI |
| JWT RS256 + refresh rotation | ✅ | ✅ | ✅ | ✅ | ✅ Completed | |
| RBAC (roles + permissions) | ✅ | ✅ | ✅ | ✅ | ✅ Completed | Guards + decorators |
| Admin bootstrap user | — | — | ✅ | — | ✅ Completed | `ADMIN_EMAIL` / `ADMIN_PASSWORD` |
| Forgot password | ✅ | — | — | — | ✅ Completed | Email flow |
| Audit logs (admin actions) | — | — | ✅ | — | ✅ Completed | `audit` module |

---

### 3.2 Geography & discovery

| Feature | Status | Notes |
|---------|--------|-------|
| Location directory (cities, pincodes) | ✅ Completed | Admin CRUD + import/export |
| Delivery coverage (merchant + admin) | ✅ Completed | Polygon / pincode rules |
| Google Maps geocoding | 🟡 Partial | Works when `GOOGLE_MAPS_API_KEY` set |
| Nearby store discovery | ✅ Completed | Geo + service areas |
| Buyer home / city / category SEO pages | ✅ Completed | Public catalog routes |
| PostGIS | 📋 Planned | Roadmap Phase 9 |

---

### 3.3 Merchant onboarding & stores

| Feature | Status | Notes |
|---------|--------|-------|
| Merchant signup + onboarding wizard | ✅ Completed | PAN/GST, documents, pincodes |
| Merchant applications (admin review) | ✅ Completed | Approve / reject / request docs |
| Store CRUD | ✅ Completed | Multi-store per merchant |
| Store approval workflow | ✅ Completed | `DRAFT → PENDING → APPROVED` |
| Store hours & settings | ✅ Completed | |
| Store reviews (buyer) | ✅ Completed | Ratings + moderation |
| Franchise expansion (API + admin) | 🟡 Partial | Backend + admin UI; niche use case |

---

### 3.4 Catalog & products

| Feature | Status | Notes |
|---------|--------|-------|
| Hierarchical categories | ✅ Completed | Admin + merchant |
| Category requests (merchant → admin) | ✅ Completed | |
| Manual product add | ✅ Completed | **Free** |
| CSV bulk upload | ✅ Completed | **Free** |
| AI product add (OpenAI vision) | ✅ Completed | Preview **free**; **₹1.50 on confirm** |
| AI image optimization (1:1, webp, thumb) | ✅ Completed | `sharp`; max 5MB |
| Supplement label validation | ✅ Completed | Block publish if label unclear; draft allowed |
| Duplicate product detection | ✅ Completed | SKU / name / brand |
| Product search (PostgreSQL FTS) | ✅ Completed | `product_search_index` |
| Image upload (local / S3) | 🟡 Partial | Default: local `UPLOAD_DIR`; R2 optional |
| Admin catalog + image coverage | ✅ Completed | |
| Inventory tracking & reservation | ✅ Completed | Checkout reservations |

---

### 3.5 Merchant AI wallet (new — June 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| `MerchantAiWallet` balance | ✅ Completed | Per merchant profile |
| `MerchantAiWalletTransaction` audit trail | ✅ Completed | RECHARGE / DEBIT / REFUND / ADJUSTMENT |
| Razorpay recharge (min ₹100) | ✅ Completed | create-order + verify + idempotency |
| Debit ₹1.50 on AI confirm | ✅ Completed | 402 if insufficient balance |
| Refund on product create failure | ✅ Completed | |
| Idempotent debit / recharge | ✅ Completed | Unit tested |
| Merchant UI: wallet card + recharge modal | ✅ Completed | Products page |
| Merchant UI: AI modal balance + CTA | ✅ Completed | |
| Admin: wallet list + detail + adjust | ✅ Completed | `/merchant-ai-wallets` |
| Admin: AI usage + wallet stats | ✅ Completed | AI Product Usage page |
| Legacy `MerchantAiCreditTransaction` | 🟡 Partial | Superseded by wallet transactions; old rows may remain |
| Razorpay webhook for wallet | 🟡 Partial | Uses client verify; no dedicated wallet webhook |

**Required env:** `OPENAI_API_KEY`, `RAZORPAY_*`, `AI_WALLET_MIN_RECHARGE_PAISE`, `AI_PRODUCT_ANALYSIS_PRICE_PAISE`

---

### 3.6 Cart, checkout & payments

| Feature | Status | Notes |
|---------|--------|-------|
| Per-store cart | ✅ Completed | |
| Checkout (address, summary, coupons) | ✅ Completed | |
| COD orders | ✅ Completed | Day-1 per architecture |
| Razorpay online payment | ✅ Completed | Order create + client checkout |
| Payer contact (name, email, phone) | ✅ Completed | Razorpay prefill |
| Payment verify + webhook | ✅ Completed | Signature verification |
| Server-side payment sync fallback | ✅ Completed | `POST /payments/razorpay/sync` |
| Buyer wallet / rewards at checkout | 🟡 Partial | `wallet-loyalty` module exists |
| JebDekho Plus / membership | 🟡 Partial | Buyer pages + API |
| Corporate portal | 🟡 Partial | Buyer + admin APIs |

---

### 3.7 Orders & fulfillment

| Feature | Status | Notes |
|---------|--------|-------|
| Order status machine | ✅ Completed | Buyer / merchant / admin views |
| Merchant order pipeline (accept, prepare, ready) | ✅ Completed | Live + list views |
| Admin order monitoring + reassignment | ✅ Completed | Unassigned queue |
| Order financials / ledger | ✅ Completed | Finance module |
| GST / compliance invoices | 🟡 Partial | Merchant GST + buyer invoice APIs |
| Settlements & payouts | 🟡 Partial | Admin settlements; merchant earnings |
| Buyer order tracking page | ✅ Completed | |
| WebSocket delivery tracking | ✅ Completed | `delivery-tracking` module |

---

### 3.8 Logistics & delivery

| Feature | Status | Notes |
|---------|--------|-------|
| Shadowfax integration | 🟡 Partial | API client, webhooks, status mapping |
| Dispatch on COD / online payment | ✅ Completed | `dispatchAfterOrderPlaced` |
| Own fleet dispatch | 🟡 Partial | `ENABLE_OWN_FLEET=false` by default |
| Porter / Delhivery / Borzo | 🔴 Not enabled | Flags off |
| Admin logistics dashboard | ✅ Completed | Health, webhooks, retry |
| Rider assignment algorithm | ✅ Completed | Nearest rider + timeout |
| Rider API (accept, deliver, location) | ✅ Completed | |
| Rider mobile app (Expo) | 🟡 Partial | Screens exist; not production release |
| Rider web full PWA | 🔴 Not built | Port 3004 = BFF documentation page only |
| Proof of delivery photo | 📋 Planned | Roadmap Phase 5.1 |

---

### 3.9 Rider & fleet

| Feature | Status | Notes |
|---------|--------|-------|
| Rider registration + admin approval | ✅ Completed | |
| Online/offline + GPS pings | ✅ Completed | Redis GEO |
| Rider earnings (API) | ✅ Completed | |
| Fleet OS (batching, routes) | 🟡 Partial | API + admin; advanced ops |
| Admin riders live map | ✅ Completed | |

---

### 3.10 Buyer engagement

| Feature | Status | Notes |
|---------|--------|-------|
| Wishlist | ✅ Completed | Profile page |
| Product compare | ✅ Completed | |
| Reviews & ratings | ✅ Completed | |
| Promotions & coupons | ✅ Completed | Admin + merchant + buyer |
| Campaigns | 🟡 Partial | Admin analytics |
| Referrals | 🟡 Partial | Profile UI |
| Push notifications (web push) | 🟡 Partial | `push` module + buyer listener |
| FCM native push | 📋 Planned | Roadmap Phase 9 |
| In-app notifications | 🟡 Partial | CRM / notification orchestrator |

---

### 3.11 Admin platform

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard / control room | ✅ Completed | |
| Users, stores, riders management | ✅ Completed | |
| Orders, inventory, settlements | ✅ Completed | |
| Finance overview | ✅ Completed | |
| Promotions, campaigns, rewards | ✅ Completed | |
| Reviews moderation | ✅ Completed | |
| Compliance & trust & safety | 🟡 Partial | APIs + admin pages |
| CRM & merchant success | 🟡 Partial | Growth tooling |
| Support center | 🟡 Partial | Ticket system |
| SEO admin | ✅ Completed | |
| Ads platform | 🟡 Partial | Auction service + admin UI |
| AI Commerce control center | 🟡 Partial | Forecast / hotspots (rule-based insights) |
| Analytics & search analytics | ✅ Completed | |
| Merchant AI wallets | ✅ Completed | New |
| AI product usage | ✅ Completed | Export CSV |

---

### 3.12 Merchant platform (beyond catalog)

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard & earnings | ✅ Completed | |
| Orders (live + history) | ✅ Completed | |
| Inventory | ✅ Completed | |
| Promotions | ✅ Completed | |
| Reviews | ✅ Completed | |
| Finance / GST | 🟡 Partial | Pages + APIs |
| Delivery coverage settings | ✅ Completed | |
| AI Commerce insights page | 🟡 Partial | Forecast, pricing tabs |
| Ads, procurement, network, growth | 🟡 Partial | UI + API scaffolding |
| Support tickets | 🟡 Partial | |

---

### 3.13 Vendor & franchise portals

| Feature | Status | Notes |
|---------|--------|-------|
| Vendor portal (catalog, orders) | 🟡 Partial | Basic dashboard pages |
| Franchise portal (territory, stores, riders) | 🟡 Partial | Basic dashboard pages |
| Supply chain / procurement admin | 🟡 Partial | API-heavy |

---

### 3.14 AI & automation

| Feature | Status | Notes |
|---------|--------|-------|
| AI product photo → catalog fields | ✅ Completed | OpenAI vision; strict JSON |
| AI wallet billing | ✅ Completed | See §3.5 |
| AI Commerce (demand forecast, inventory crisis) | 🟡 Partial | Services + UI; not ML training pipeline |
| Merchant AI insights page | 🟡 Partial | Separate from product-add AI |

---

## 4. Infrastructure & deployment

| Item | Status | Notes |
|------|--------|-------|
| pnpm monorepo + Turborepo | ✅ Completed | |
| Docker Compose (dev: Postgres, Redis, MinIO) | ✅ Completed | |
| VPS deploy script (`deploy/deploy.sh`) | ✅ Completed | pull → migrate → build → PM2 |
| PM2 ecosystem (7 processes) | ✅ Completed | API + 6 Next.js apps |
| Prisma migrations | ✅ Completed | Latest: `20260626120000_merchant_ai_wallet` |
| Rollback script | ✅ Completed | `deploy/rollback.sh` |
| Nginx + Cloudflare | 🟡 Partial | Documented; manual VPS setup |
| Docker production images | 🔴 Not used | PM2-native deploy path |
| Automated DB backups | 🟡 Partial | Script exists; cron on ops |
| Sentry / APM | 🔴 Optional | `SENTRY_DSN` in env template |
| CI (lint + test on PR) | 🟡 Unknown | Check `.github/workflows` on repo |
| Security audit checklist | 🔴 Open | `deploy/docs/SECURITY_AUDIT.md` mostly unchecked |

---

## 5. Testing coverage

| Layer | Count / status |
|-------|----------------|
| API unit tests | ~95 spec files (auth, checkout, payment, product AI, wallet, logistics, etc.) |
| AI wallet tests | ✅ Min recharge, signature, idempotent debit/verify, refund |
| Product AI tests | ✅ No charge on analyze, charge on confirm, supplement rules |
| Image optimization tests | ✅ Type/size validation, 1:1 output |
| E2E (Playwright) | 🔴 Not present |
| Load testing (k6) | 🔴 Not present |
| Frontend tests | 🔴 Minimal / none observed |

---

## 6. Environment & third-party dependencies

| Service | Required for | Production status |
|---------|--------------|-------------------|
| PostgreSQL | Everything | ✅ Required |
| Redis | Sessions, rate limits, rider GEO | ✅ Required |
| SMTP (Hostinger) | Email auth, notifications | ✅ Required |
| Razorpay | Online checkout + **AI wallet recharge** | 🟡 Configure live keys |
| OpenAI | AI product add | 🟡 Configure `OPENAI_API_KEY` |
| MSG91 | Phone OTP | 🔴 Disabled until DLT approval |
| Google Maps | Maps, autocomplete | 🟡 Optional (fallback exists) |
| Shadowfax | 3PL delivery | 🟡 Disabled until credentials |
| Cloudflare R2 | CDN uploads | 🟡 Optional (local uploads default) |

---

## 7. Completed recently (June 2026)

1. **Merchant AI wallet** — prepaid balance, Razorpay recharge (min ₹100), ₹1.50 debit on AI confirm only  
2. **AI image pipeline** — optimize, thumbnail, supplement label rules, no hallucinated FSSAI/ingredients  
3. **Checkout hardening** — payer contact, Razorpay sync fallback when client verify fails  
4. **Logistics** — dispatch rider request on COD / online payment (not only `READY_FOR_PICKUP`)  
5. **Admin** — merchant AI wallets page, wallet stats on AI usage  

---

## 8. Remaining work (prioritized)

### P0 — Before full production launch

- [ ] Run `prisma migrate deploy` on VPS after each release  
- [ ] Set production `.env.production`: Razorpay live keys, OpenAI key, SMTP  
- [ ] Configure Shadowfax (`SHADOWFAX_API_URL`, token, webhook URL) or confirm own-fleet-only ops  
- [ ] Complete `deploy/docs/SECURITY_AUDIT.md` checklist  
- [ ] Uptime monitoring on `/health`  
- [ ] Verify Razorpay webhook URL in dashboard  
- [ ] End-to-end manual QA: buyer checkout (COD + online), merchant AI wallet recharge, AI product confirm  

### P1 — Core gaps

- [ ] **Phone OTP (MSG91)** — enable when DLT approved  
- [ ] **Rider experience** — ship rider-mobile to stores or build rider PWA  
- [ ] **R2 / CDN** — move uploads off local disk for scale  
- [ ] **E2E tests** — at least checkout + payment + AI wallet flows  
- [ ] Deprecate / migrate legacy `MerchantAiCreditTransaction` reads  

### P2 — Polish & scale (roadmap Phase 7–9)

- [ ] Elasticsearch or managed search at SKU scale  
- [ ] PostGIS for geospatial queries  
- [ ] FCM push notifications  
- [ ] Docker images + registry deploy  
- [ ] Load testing (100 concurrent checkouts)  
- [ ] Sentry + structured alerting  
- [ ] Order table partitioning at volume  
- [ ] Proof-of-delivery photos  

### P3 — Optional / expansion modules

- [ ] Vendor portal production workflows  
- [ ] Franchise territory management production workflows  
- [ ] AI Commerce real ML models (vs heuristic forecasts)  
- [ ] Ads auction go-live  
- [ ] Corporate B2B ordering  

---

## 9. QA checklist (post-deploy)

### Commerce

- [ ] Buyer: browse store → add to cart → COD order → merchant sees order  
- [ ] Buyer: Razorpay checkout → payment success → order `PAID`  
- [ ] Merchant: accept → prepare → ready for pickup  

### AI products

- [ ] Manual add and CSV upload — no wallet charge  
- [ ] AI analyze preview — no charge  
- [ ] AI confirm with balance ≥ ₹1.50 — debit once  
- [ ] AI confirm with low balance — 402 + recharge CTA  
- [ ] Supplement blurry label — draft only, publish blocked  

### AI wallet

- [ ] Recharge ₹100 via Razorpay — balance updates  
- [ ] Duplicate verify — no double credit  
- [ ] Admin adjust balance — audit transaction  

### Logistics

- [ ] COD order — Shadowfax dispatch triggered (when enabled)  
- [ ] Online paid order — dispatch triggered after payment  

---

## 10. Document references

| Document | Path |
|----------|------|
| Architecture overview | `docs/architecture/01-system-architecture.md` |
| Development roadmap | `docs/architecture/07-development-roadmap.md` |
| Deployment guide | `docs/architecture/08-deployment.md` |
| Store approval | `docs/architecture/09-store-approval-workflow.md` |
| Production env template | `.env.production.example` |
| Deploy script | `deploy/deploy.sh` |
| Security checklist | `deploy/docs/SECURITY_AUDIT.md` |

---

## 11. Summary scorecard

| Category | Completed | Partial | Remaining |
|----------|-----------|---------|-----------|
| Core marketplace loop | 85% | 10% | 5% |
| Merchant tools | 80% | 15% | 5% |
| Admin platform | 75% | 20% | 5% |
| Payments & billing | 90% | 10% | 0% |
| Logistics & rider | 50% | 35% | 15% |
| Auth (phone OTP) | 40% | 0% | 60% |
| Production ops | 60% | 25% | 15% |
| Test automation | 40% | 0% | 60% |

**Overall:** The platform is **demo- and soft-launch capable** for Delhi NCR with email auth, COD, and optional Razorpay. **Full production** requires VPS env completion, logistics credentials, security audit, and rider app shipping. **Phone OTP and scale infrastructure** remain the largest functional gaps vs the original roadmap.

---

*This report is generated from codebase inspection and may drift from live VPS configuration. Re-run audit after major releases.*
