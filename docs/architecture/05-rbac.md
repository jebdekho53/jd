# Jebdekho — Role-Based Access Control (RBAC)

## 1. Model

RBAC uses a **Role + Permission** model with optional **resource scoping** enforced in the service layer.

```
User ──M:N──► Role ──M:N──► Permission
                │
                └── Scoped checks in services (storeId, buyerId, riderId)
```

**Principle:** Guards verify *whether* an action is allowed; services verify *which resources* the user can access.

---

## 2. Roles

| Role | Code | Description |
|------|------|-------------|
| Buyer | `BUYER` | End customer |
| Merchant | `MERCHANT` | Store owner or staff |
| Rider | `RIDER` | Delivery partner |
| Admin | `ADMIN` | Platform operator |
| Super Admin | `SUPER_ADMIN` | Full platform control (subset of ADMIN) |

A user may hold **multiple roles** (e.g. BUYER + MERCHANT). JWT includes all active roles; `@Roles()` decorator accepts any matching role.

---

## 3. Permission Naming Convention

Format: `{resource}:{action}`

Examples:
- `products:read`
- `products:write`
- `orders:read`
- `orders:update_status`
- `stores:manage`
- `riders:approve`
- `coupons:write`
- `analytics:read`
- `users:manage`
- `platform:settings`

---

## 4. Default Role → Permission Matrix

### BUYER

| Permission | Scope |
|------------|-------|
| `cart:read`, `cart:write` | Own cart |
| `orders:read`, `orders:create` | Own orders |
| `orders:cancel` | Own orders (pre-preparing only) |
| `reviews:write` | Own completed orders |
| `wishlist:read`, `wishlist:write` | Own wishlist |
| `addresses:read`, `addresses:write` | Own addresses |
| `profile:read`, `profile:write` | Own profile |

### MERCHANT

| Permission | Scope |
|------------|-------|
| `stores:read`, `stores:write` | Owned/assigned stores only |
| `stores:submit` | Submit DRAFT store for admin review |
| `products:read`, `products:write` | Own store products |
| `inventory:read`, `inventory:write` | Own store inventory |
| `orders:read`, `orders:update_status` | Own store orders |
| `analytics:read` | Own store analytics |
| `profile:read`, `profile:write` | Own merchant profile |

### RIDER

| Permission | Scope |
|------------|-------|
| `deliveries:read`, `deliveries:update` | Assigned deliveries |
| `rider:status` | Own online/offline toggle |
| `rider:location` | Own location updates |
| `earnings:read` | Own earnings |
| `profile:read`, `profile:write` | Own profile |

### ADMIN

| Permission | Scope |
|------------|-------|
| `users:read`, `users:manage` | Platform |
| `merchants:read`, `merchants:manage` | Platform |
| `riders:read`, `riders:approve`, `riders:manage` | Platform |
| `orders:read`, `orders:manage` | Platform |
| `coupons:read`, `coupons:write` | Platform |
| `analytics:read` | Platform-wide |
| `cities:read`, `cities:write` | Platform |
| `platform:settings` | Platform |
| `stores:approve`, `stores:reject`, `stores:suspend` | Store approval workflow |

### SUPER_ADMIN

All ADMIN permissions plus:
- `admins:invite`
- `admins:manage`
- `roles:manage`
- `permissions:manage`

---

## 5. NestJS Guard Stack

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('MERCHANT')
@Permissions('products:write')
@Post('stores/:storeId/products')
createProduct(@CurrentUser() user, @Param('storeId') storeId: string) { ... }
```

### Guard Execution Order

1. **JwtAuthGuard** — Validates JWT, attaches `user` to request
2. **RolesGuard** — Checks `@Roles()` metadata (OR logic)
3. **PermissionsGuard** — Checks `@Permissions()` metadata (AND logic by default)

---

## 6. Resource Scoping (Service Layer)

Guards do **not** trust client-supplied IDs. Every mutating service method validates ownership:

```typescript
// Merchant product update
async updateProduct(userId: string, storeId: string, productId: string, dto: UpdateProductDto) {
  const store = await this.prisma.store.findFirst({
    where: { id: storeId, merchantProfile: { userId }, deletedAt: null },
  });
  if (!store) throw new ForbiddenException();

  return this.prisma.product.update({
    where: { id: productId, storeId },
    data: dto,
  });
}
```

### Scoping Rules

| Actor | Rule |
|-------|------|
| Buyer | `buyerId === user.buyerProfile.id` |
| Merchant | `store.merchantProfile.userId === user.id` OR staff assignment table |
| Rider | `delivery.riderId === user.riderProfile.id` |
| Admin | No ownership check; audit log required for mutations |

---

## 7. Merchant Staff (Future Extension)

`store_staff` table links users to stores with a `staffRole`:

- `OWNER` — full store access
- `MANAGER` — products, orders, inventory
- `STAFF` — orders only

Permissions resolved as: `role permissions ∪ staffRole permissions`.

---

## 8. Database Tables

```
roles              id, name (enum), description
permissions        id, name (unique), description, module
role_permissions   roleId, permissionId
user_roles         userId, roleId, assignedAt, assignedBy
```

Seed script creates all roles and permissions; assigns SUPER_ADMIN to first admin user.

---

## 9. Admin Permission Customization

Super admins can create **custom admin roles** (Phase 3):

```
admin_roles        id, name
admin_role_permissions
user_admin_roles   userId, adminRoleId
```

MVP: fixed ADMIN + SUPER_ADMIN roles only.

---

## 10. API Authorization Errors

| Code | When |
|------|------|
| 401 Unauthorized | Missing/invalid JWT |
| 403 Forbidden | Valid JWT but insufficient role/permission |
| 403 Forbidden | Valid permission but resource not owned |

Response shape:

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "requiredPermission": "products:write"
}
```

---

## 11. Frontend Route Protection

Each Next.js app mirrors RBAC client-side for UX (hide nav items) but **never relies on client checks for security**.

```typescript
// middleware.ts — buyer-web
const protectedPaths = ['/cart', '/checkout', '/orders'];
if (protectedPaths.some(p => pathname.startsWith(p)) && !token) {
  redirect('/login');
}
```

Role-specific apps use separate subdomains → separate Next.js apps → simpler middleware.

---

## 12. Testing RBAC

Unit tests per guard; e2e tests matrix:

| Endpoint | BUYER | MERCHANT | RIDER | ADMIN |
|----------|-------|----------|-------|-------|
| GET /orders (own) | ✓ | ✓ (store) | ✓ (assigned) | ✓ |
| POST /admin/users | ✗ | ✗ | ✗ | ✓ |

---

## 13. Approval Questions

1. Should merchants invite staff in MVP or Phase 2?
2. Can a merchant also be a buyer with the same phone? (Recommended: yes, multi-role)
3. Rider approval workflow: manual admin only or automated document OCR later?
