# Jebdekho — Database Design

PostgreSQL 16+ with Prisma ORM. Schema file: `prisma/schema.prisma`.

---

## 1. Entity Relationship Overview

```
                    ┌──────────┐
                    │   City   │
                    └────┬─────┘
                         │ 1:N
                    ┌────▼─────┐
                    │   Zone   │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │  Store  │    │   User    │   │   Rider   │
    └────┬────┘    └─────┬─────┘   └─────┬─────┘
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐         │
    │ Product │    │  Profiles │         │
    └────┬────┘    │ (Buyer/   │         │
         │         │ Merchant) │         │
    ┌────▼────┐    └─────┬─────┘         │
    │Inventory│          │               │
    └─────────┘    ┌─────▼─────┐   ┌─────▼─────┐
                   │   Order   │◄──│ Delivery  │
                   └─────┬─────┘   └───────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         OrderItem   Payment    OrderStatusHistory
```

---

## 2. Core Tables & Relationships

### 2.1 Identity & RBAC

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | Central auth identity | 1:1 profiles, 1:N refresh_tokens |
| `roles` | BUYER, MERCHANT, RIDER, ADMIN | M:N permissions via `role_permissions` |
| `permissions` | Granular actions | e.g. `orders:read`, `products:write` |
| `user_roles` | User ↔ Role assignment | Supports multi-role (merchant + buyer) |
| `refresh_tokens` | Rotating refresh tokens | Hashed token, device metadata |
| `otp_verifications` | Phone/email OTP | Rate-limited, expiring |

### 2.2 Profiles

| Table | Purpose |
|-------|---------|
| `buyer_profiles` | Default address prefs, notification settings |
| `merchant_profiles` | Business name, KYC status, linked stores |
| `rider_profiles` | Vehicle type, documents, online status |
| `admin_profiles` | Department, super-admin flag |
| `addresses` | Polymorphic owner (buyer); lat/lng for delivery |

### 2.3 Geography (Delhi NCR Launch)

| Table | Purpose |
|-------|---------|
| `cities` | Delhi NCR (seeded at launch) |
| `zones` | South Delhi, Gurgaon, Noida, Ghaziabad, Faridabad |
| `service_areas` | Finer areas within zones (Hauz Khas, Saket, Cyber City, etc.) |
| `store_zones` | M:N — stores serve which zones |
| `store_service_areas` | M:N — optional hyperlocal delivery polygons |
| `rider_zones` | M:N — riders operate in which zones |

**Resolution:** GPS → `service_areas` → `zones` → `store_zones` → approved stores.

### 2.4 Commerce

| Table | Purpose |
|-------|---------|
| `stores` | Storefront with approval workflow (`DRAFT` → `PENDING_REVIEW` → `APPROVED`) |
| `store_hours` | Weekly open/close schedule |
| `categories` | Hierarchical (parentId); global or store-scoped |
| `products` | Base product; belongs to store |
| `product_variants` | SKU-level: size, weight, price override |
| `product_search_index` | Denormalized FTS table — **no LIKE on products** |
| `inventory` | Stock per variant; reserved qty for pending orders |
| `carts` / `cart_items` | Persistent cart per buyer (per store) |
| `wishlist_items` | Buyer ↔ product |

### 2.5 Orders & Fulfillment

| Table | Purpose |
|-------|---------|
| `orders` | Header incl. `payment_method` (COD/RAZORPAY), `payment_status` |
| `order_items` | Line items with price snapshot at order time |
| `order_status_history` | Append-only status audit |
| `deliveries` | Rider assignment, pickup/delivery timestamps |
| `rider_locations` | Time-series location pings (partition candidate) |
| `delivery_assignments` | Assignment offers with accept/reject/timeout |

### 2.6 Payments & Promotions

| Table | Purpose |
|-------|---------|
| `payments` | Razorpay-specific records (nullable for COD-only orders) |
| `payment_transactions` | Refunds |
| `coupons` | Platform or store-scoped |
| `coupon_usages` | Per-order redemption tracking |
| `reviews` | Buyer reviews for store/product |

**Payment status on order:** `PENDING` | `PAID` | `FAILED` | `REFUNDED`

### 2.7 Platform, Events & Notifications

| Table | Purpose |
|-------|---------|
| `platform_settings` | Key-value config |
| `domain_events` | ORDER_CREATED, PAYMENT_COMPLETED, STORE_APPROVED, etc. |
| `audit_logs` | Admin actions with actor, IP, resource |
| `notifications` | In-app user inbox |
| `notification_templates` | Reusable SMS/email/push templates |
| `notification_deliveries` | Per-channel outbound delivery tracking |

---

## 3. Constraints

| Constraint | Rationale |
|------------|-----------|
| `users.email` UNIQUE (nullable) | Email login |
| `users.phone` UNIQUE (required) | Primary identifier for OTP |
| `products(storeId, slug)` UNIQUE | SEO-friendly URLs per store |
| `inventory(variantId)` UNIQUE | One inventory row per variant |
| `orders.orderNumber` UNIQUE | Human-readable reference |
| `payments.razorpayOrderId` UNIQUE | Idempotent webhook handling |
| `coupon_usages(couponId, orderId)` UNIQUE | One redemption per order |
| CHECK `inventory.quantity >= 0` | No negative stock |
| CHECK `inventory.reserved <= quantity` | Reserved cannot exceed stock |
| FK `ON DELETE RESTRICT` on orders→stores | Preserve order history |
| FK `ON DELETE CASCADE` on cart_items | Cart cleanup |

---

## 4. Indexes

### 4.1 Identity

```sql
CREATE UNIQUE INDEX users_email_idx ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_phone_idx ON users(phone);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);
CREATE INDEX otp_verifications_phone_created_idx ON otp_verifications(phone, created_at DESC);
```

### 4.2 Geographic & Discovery

```sql
CREATE INDEX stores_city_active_idx ON stores(city_id, is_active);
CREATE INDEX stores_location_idx ON stores(latitude, longitude);
CREATE INDEX stores_zone_idx ON store_zones(zone_id);
CREATE INDEX zones_city_idx ON zones(city_id);
```

**Future (PostGIS):**

```sql
CREATE INDEX stores_geo_idx ON stores USING GIST(location);
```

### 4.3 Catalog & Search

```sql
CREATE INDEX products_store_active_idx ON products(store_id, is_active);
CREATE INDEX product_search_store_active_idx ON product_search_index(store_id, is_active);
CREATE INDEX product_search_text_idx ON product_search_index(search_text);

-- After migrate: add generated tsvector column + GIN index (see 10-events-notifications-search.md)
CREATE INDEX product_variants_product_idx ON product_variants(product_id);
CREATE INDEX inventory_variant_idx ON inventory(variant_id);

-- Store approval queue
CREATE INDEX stores_status_submitted_idx ON stores(status, submitted_at DESC);
```

### 4.4 Orders (High Volume)

```sql
CREATE INDEX orders_buyer_status_idx ON orders(buyer_id, status);
CREATE INDEX orders_store_status_idx ON orders(store_id, status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);
CREATE INDEX orders_payment_idx ON orders(payment_method, payment_status);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_status_history_order_idx ON order_status_history(order_id, created_at);
```

### 4.5 Riders & Deliveries

```sql
CREATE INDEX deliveries_order_idx ON deliveries(order_id);
CREATE INDEX deliveries_rider_status_idx ON deliveries(rider_id, status);
CREATE INDEX rider_locations_rider_time_idx ON rider_locations(rider_id, recorded_at DESC);
CREATE INDEX delivery_assignments_rider_status_idx ON delivery_assignments(rider_id, status);
```

### 4.6 Payments & Reviews

```sql
CREATE INDEX payments_order_idx ON payments(order_id);
CREATE INDEX payments_razorpay_order_idx ON payments(razorpay_order_id);
CREATE INDEX reviews_store_idx ON reviews(store_id);
CREATE INDEX coupon_usages_coupon_idx ON coupon_usages(coupon_id);
```

---

## 5. Data Integrity Patterns

### Price Snapshots

Order line items store `unitPrice`, `discount`, `tax` at order time. Product price changes never mutate historical orders.

### Address Snapshots

Orders embed delivery address fields (JSON or denormalized columns) so moves/deletes of `addresses` do not corrupt history.

### Inventory Reservation

On checkout initiation: `reserved += qty`. On payment success: `quantity -= qty`, `reserved -= qty`. On timeout/cancel: release reservation.

### Soft Deletes

`users.deletedAt`, `products.deletedAt`, `stores.deletedAt` — queries filter `deletedAt IS NULL`.

---

## 6. Scaling Considerations

| Challenge | Strategy |
|-----------|----------|
| **Millions of products** | `product_search_index` + PostgreSQL FTS; Elasticsearch at 5M+ rows |
| **Order volume** | Monthly partition `orders` by `created_at`; archive cold data |
| **Rider location pings** | TimescaleDB or partition `rider_locations` by week; retain 30 days hot |
| **Read-heavy catalog** | Redis cache + CDN for images; read replicas |
| **Write-heavy checkout** | Optimistic locking on inventory (`version` column); queue for webhook processing |
| **Multi-city** | All discovery queries filter `city_id` first — shrinks scan set |
| **Connection pool** | PgBouncer in transaction mode; Prisma connection limit tuned per instance |

---

## 7. Migration Strategy

1. `prisma migrate dev` in development
2. `prisma migrate deploy` in CI/CD production
3. Seed script: roles, permissions, **Delhi NCR** city/zones/service areas, notification templates
4. Backward-compatible migrations only in production (additive columns, no destructive drops without dual-write period)

---

## 8. Extensions (Optional)

Enable in `docker/postgres/init.sql`:

- `uuid-ossp` or use Prisma `cuid()` / `uuid()`
- `pg_trgm` — fuzzy product search
- `postgis` — production-grade geospatial (Phase 2)

---

## 9. Confirmed Decisions (v2)

1. **Cart per store** — single-store checkout
2. **Store approval** — admin mandatory (`DRAFT` → `PENDING_REVIEW` → `APPROVED`)
3. **COD + Razorpay** — both from Day 1
4. **Product search** — dedicated `product_search_index` table
5. **Launch geography** — Delhi NCR with zones and service areas
