# Jebdekho — API Versioning Strategy

## 1. Principles

- **URL path versioning** — explicit, cache-friendly, industry standard
- **Breaking changes** require new major version (`v2`)
- **Non-breaking additions** ship in current version
- All clients use **`/api/v1`** prefix; WebSockets at **`/ws`**

---

## 2. Base URL Structure

```
Production:
  https://api.jebdekho.com/api/v1/...
  wss://api.jebdekho.com/ws

Development:
  http://localhost:3001/api/v1/...
  ws://localhost:3001/ws
```

---

## 3. Route Organization

```
/api/v1/
├── auth/                    # Public + authenticated auth
├── buyers/                  # Buyer-scoped resources
├── merchants/               # Merchant profile
├── stores/                  # Store CRUD, discovery
├── products/                # Catalog
├── categories/
├── cart/
├── orders/
├── payments/
├── deliveries/
├── riders/
├── reviews/
├── wishlist/
├── coupons/                 # Buyer-facing coupon apply
├── geo/                     # Cities, zones, nearby
├── uploads/                 # Presigned URLs
├── notifications/
├── admin/                   # Admin-only subtree
│   ├── users/
│   ├── merchants/
│   ├── riders/
│   ├── orders/
│   ├── coupons/
│   ├── cities/
│   ├── analytics/
│   └── settings/
└── health/
    ├── GET /              # Liveness
    └── GET /ready         # DB + Redis readiness
```

---

## 4. REST Conventions

| Action | Method | Example |
|--------|--------|---------|
| List | GET | `/api/v1/stores?cityId=x&zoneId=y` |
| Get one | GET | `/api/v1/stores/:id` |
| Create | POST | `/api/v1/stores` |
| Full update | PUT | `/api/v1/stores/:id` |
| Partial update | PATCH | `/api/v1/stores/:id` |
| Delete | DELETE | `/api/v1/stores/:id` |
| Action | POST | `/api/v1/orders/:id/cancel` |

### Naming Rules

- Plural nouns for collections: `/orders`, `/products`
- kebab-case for multi-word: `/order-items` (if exposed)
- Nested resources max 2 levels: `/stores/:storeId/products`
- Actions as verbs on resource: `/orders/:id/accept`, `/riders/me/go-online`

---

## 5. Request / Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Invalid phone number" }
  ],
  "timestamp": "2026-06-22T10:00:00.000Z",
  "path": "/api/v1/auth/register/buyer"
}
```

---

## 6. Pagination

Query params: `?page=1&limit=20&sort=createdAt&order=desc`

Default limit: 20. Max limit: 100.

Cursor-based pagination for high-volume endpoints (orders, rider locations) in Phase 2:

```
?cursor=eyJpZCI6...&limit=20
```

---

## 7. Filtering & Search

```
GET /api/v1/stores/nearby?lat=28.6139&lng=77.2090&radiusKm=5
GET /api/v1/products/search?q=milk&storeId=xxx
GET /api/v1/orders?status=PREPARING&storeId=xxx
```

---

## 8. Version Lifecycle

| Version | Status | Support |
|---------|--------|---------|
| v1 | Active (MVP → production) | Full support |
| v2 | Future | 12-month overlap after v2 GA |

### Deprecation Headers

When deprecating an endpoint:

```
Deprecation: true
Sunset: Sat, 01 Jan 2028 00:00:00 GMT
Link: </api/v2/orders>; rel="successor-version"
```

---

## 9. Breaking vs Non-Breaking Changes

### Non-Breaking (same version)

- Adding optional request fields
- Adding response fields
- Adding new endpoints
- Adding new enum values (clients must tolerate unknown values)

### Breaking (new version required)

- Removing/renaming fields
- Changing field types
- Changing auth requirements
- Changing URL structure
- Changing error codes for same condition

---

## 10. NestJS Implementation

```typescript
// main.ts
app.setGlobalPrefix('api/v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});

// Future v2: separate module or duplicate controllers
@Controller({ path: 'orders', version: '2' })
export class OrdersV2Controller { ... }
```

Enable URI versioning in NestJS when v2 launches:

```typescript
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
```

---

## 11. OpenAPI Documentation

- Swagger UI at `/api/docs` (disabled in production or admin-only)
- Generated from NestJS decorators
- Exported to `docs/openapi/v1.yaml` in CI

---

## 12. Rate Limiting

| Tier | Limit |
|------|-------|
| Public auth endpoints | 10 req/min per IP |
| Authenticated API | 100 req/min per user |
| Admin API | 200 req/min per user |
| WebSocket connections | 5 per user |

Implemented via `@nestjs/throttler` + Redis store.

---

## 13. Idempotency

Payment and order creation endpoints accept:

```
Idempotency-Key: <uuid>
```

Stored in Redis for 24h to prevent duplicate orders on retry.

---

## 14. Webhook Endpoints (Unversioned)

External services use stable URLs:

```
POST /webhooks/razorpay    # Signature verified, not under /api/v1
```

Webhooks are excluded from JWT auth; secured by provider signatures.
