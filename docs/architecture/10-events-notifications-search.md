# Jebdekho — Domain Events & Notifications

## 1. Domain Events (`domain_events`)

Append-only event log for async processing, analytics, and notification triggers.

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `event_type` | enum | Business event name |
| `aggregate_type` | string | e.g. `order`, `store`, `payment` |
| `aggregate_id` | string | Entity ID |
| `payload` | JSON | Event-specific data |
| `metadata` | JSON | traceId, userId, source |
| `occurred_at` | timestamp | When event happened |
| `processed_at` | timestamp | When consumers finished (nullable) |

### Event Types (Phase 1+)

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `ORDER_CREATED` | Checkout complete | Analytics, merchant notify |
| `ORDER_ACCEPTED` | Merchant accepts | Buyer push/SMS |
| `ORDER_ASSIGNED` | Rider assigned | Rider push, buyer tracking |
| `ORDER_DELIVERED` | Delivery confirmed | Review prompt, COD collect |
| `PAYMENT_COMPLETED` | Razorpay webhook / COD collected | Order state, receipt |
| `STORE_SUBMITTED` | Merchant submits store | Admin queue |
| `STORE_APPROVED` | Admin approves | Merchant SMS |
| `STORE_REJECTED` | Admin rejects | Merchant SMS + reason |

### Processing Pattern (Phase 1)

```
Service completes transaction
  → INSERT domain_events (same DB transaction)
  → NestJS EventEmitter / Bull queue (Phase 2)
  → NotificationService dispatches deliveries
  → UPDATE processed_at
```

At 100k+ users, migrate to **outbox pattern** + dedicated worker without schema change.

---

## 2. Audit Logs (`audit_logs`)

Immutable log of **admin and sensitive actions**.

| Field | Description |
|-------|-------------|
| `actor_id` | User who performed action |
| `action` | e.g. `STORE_APPROVED`, `USER_SUSPENDED`, `COUPON_CREATED` |
| `resource_type` | `store`, `user`, `order`, `coupon` |
| `resource_id` | Target entity ID |
| `ip_address` | Client IP |
| `user_agent` | Browser/app identifier |
| `metadata` | Before/after diff, reason |

**Logged actions:** All admin mutations, store approval/reject/suspend, rider approve/reject, platform settings changes, manual order interventions.

**Not logged:** Routine buyer browsing, cart updates (use application logs instead).

---

## 3. Notification Architecture

Three-layer design:

```
NotificationTemplate  →  Notification  →  NotificationDelivery
     (reusable)            (in-app record)     (per-channel outbound)
```

### 3.1 Templates (`notification_templates`)

| Field | Description |
|-------|-------------|
| `code` | Unique key: `ORDER_CONFIRMED_SMS` |
| `channel` | SMS, EMAIL, PUSH, WHATSAPP, IN_APP |
| `subject` | Email subject (nullable) |
| `body` | Template with `{{orderNumber}}` placeholders |

### 3.2 In-App (`notifications`)

Existing table — user inbox in buyer/merchant/admin apps.

### 3.3 Deliveries (`notification_deliveries`)

| Field | Description |
|-------|-------------|
| `channel` | SMS / EMAIL / PUSH / WHATSAPP |
| `recipient` | Phone, email, or push token |
| `status` | PENDING → QUEUED → SENT → DELIVERED / FAILED |
| `provider_ref` | MSG91 message ID, FCM token response |
| `template_id` | Optional link to template |

### Channels

| Channel | Provider (MVP) | Used For |
|---------|----------------|----------|
| **SMS** | MSG91 | OTP, order updates |
| **EMAIL** | SMTP / SendGrid | Receipts, merchant alerts |
| **PUSH** | FCM (Phase 2) | Rider assignments, live tracking |
| **WHATSAPP** | MSG91 WhatsApp API (Phase 2) | Order status |
| **IN_APP** | WebSocket + DB | All apps |

### Flow Example — Order Confirmed

```
1. ORDER_CREATED domain event emitted
2. NotificationService:
   - Create in-app notification
   - Queue SMS delivery (MSG91) from template ORDER_CONFIRMED_SMS
   - Insert notification_deliveries rows
3. SMS worker sends → updates status SENT/DELIVERED
4. Mark domain_event processed_at
```

---

## 4. Product Search (`product_search_index`)

Denormalized search table — **never use LIKE on `products.name` at scale**.

| Field | Purpose |
|-------|---------|
| `search_text` | Concatenated: name + description + category + tags |
| `store_id` | Scope search per store or city |
| `is_active` | Filter inactive/deleted |

### PostgreSQL Full-Text Search (migration)

After Prisma migrate, run custom SQL:

```sql
ALTER TABLE product_search_index
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(search_text, ''))) STORED;

CREATE INDEX product_search_vector_idx
  ON product_search_index USING GIN (search_vector);
```

Query:

```sql
SELECT product_id FROM product_search_index
WHERE store_id = $1 AND is_active = true
  AND search_vector @@ plainto_tsquery('english', $2)
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $2)) DESC
LIMIT 20;
```

**Sync:** On product create/update/delete, upsert `product_search_index` in same transaction or via domain event consumer.

**Future:** Elasticsearch when cross-store search exceeds PostgreSQL comfort zone (~5M+ rows).

---

## 5. Geography — Delhi NCR

```
City: Delhi NCR
├── Zone: South Delhi
│   ├── Service Area: Hauz Khas
│   ├── Service Area: Saket
│   └── Service Area: Greater Kailash
├── Zone: Gurgaon
│   ├── Service Area: DLF Phase 1-3
│   └── Service Area: Cyber City
├── Zone: Noida
├── Zone: Ghaziabad
└── Zone: Faridabad
```

**Resolution flow:**

1. Buyer GPS → nearest `service_area` (radius check)
2. Service area → `zone` → stores via `store_zones`
3. Riders matched via `rider_zones` in same zone

---

## 6. COD Payment Flow

| Step | `payment_method` | `payment_status` |
|------|------------------|------------------|
| Order placed | `COD` | `PENDING` |
| Order delivered, cash collected | `COD` | `PAID` |
| Collection failed | `COD` | `FAILED` |

Razorpay orders: `PENDING` → webhook → `PAID`.

Both methods stored on `orders` for reporting; `payments` table holds Razorpay-specific details.
