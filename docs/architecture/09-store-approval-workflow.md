# Jebdekho — Store Approval Workflow

Admin approval is **mandatory** before any store goes live on the buyer app.

---

## 1. Store Status Lifecycle

```
DRAFT → PENDING_REVIEW → APPROVED → (live on platform)
              │                │
              ▼                ▼
          REJECTED         SUSPENDED
              │
              └──► DRAFT (merchant edits & resubmits)
```

| Status | Visible to Buyers | Merchant Can Edit | Admin Action |
|--------|-------------------|-------------------|--------------|
| `DRAFT` | No | Yes | — |
| `PENDING_REVIEW` | No | Limited (withdraw only) | Approve / Reject |
| `APPROVED` | Yes (`isActive = true`) | Settings only | Suspend |
| `REJECTED` | No | Yes (fix & resubmit) | — |
| `SUSPENDED` | No | No (read-only) | Reinstate |

---

## 2. Merchant Flow

### Step 1 — Create Store (DRAFT)

```
POST /api/v1/stores
→ status: DRAFT
→ isActive: false
```

Merchant completes: name, address, hours, zones, service areas, documents.

### Step 2 — Submit for Review

```
POST /api/v1/stores/:id/submit-for-review
→ status: PENDING_REVIEW
→ submittedAt: now()
→ Domain event: STORE_SUBMITTED
→ Admin notification (SMS + in-app)
```

Validation before submit:
- All required fields filled
- At least one zone mapped
- Store hours configured
- KYC documents uploaded (if required by platform settings)

### Step 3 — Admin Review

```
GET  /api/v1/admin/stores?status=PENDING_REVIEW
POST /api/v1/admin/stores/:id/approve
POST /api/v1/admin/stores/:id/reject  { reason }
POST /api/v1/admin/stores/:id/suspend { reason }
POST /api/v1/admin/stores/:id/reinstate
```

**Approve:**
- `status → APPROVED`, `isActive → true`, `reviewedAt`, `reviewedBy`
- Domain event: `STORE_APPROVED`
- Merchant notification

**Reject:**
- `status → REJECTED`, `rejectionReason`, `reviewedAt`, `reviewedBy`
- Domain event: `STORE_REJECTED`
- Merchant notification with reason

**Suspend:**
- `status → SUSPENDED`, `isActive → false`
- Domain event: `STORE_SUSPENDED`
- All audit logged in `audit_logs`

---

## 3. Database Fields (`stores`)

| Field | Purpose |
|-------|---------|
| `status` | Current workflow state |
| `submitted_at` | When merchant submitted for review |
| `reviewed_at` | Last admin review timestamp |
| `reviewed_by` | Admin user ID |
| `rejection_reason` | Shown to merchant on reject |
| `is_active` | Denormalized flag for fast buyer queries (`true` only when `APPROVED`) |

---

## 4. RBAC Permissions

| Permission | Role |
|------------|------|
| `stores:read` | Merchant (own), Admin (all) |
| `stores:write` | Merchant (own, DRAFT/REJECTED only) |
| `stores:submit` | Merchant |
| `stores:approve` | Admin |
| `stores:reject` | Admin |
| `stores:suspend` | Admin |

---

## 5. Audit & Events

Every admin action writes:

1. **`audit_logs`** — actor, action, resource, IP
2. **`domain_events`** — `STORE_APPROVED`, `STORE_REJECTED`, `STORE_SUSPENDED`

Example audit entry:

```json
{
  "actorId": "admin_user_id",
  "action": "STORE_APPROVED",
  "resourceType": "store",
  "resourceId": "store_cuid",
  "ipAddress": "103.x.x.x",
  "metadata": { "previousStatus": "PENDING_REVIEW" }
}
```

---

## 6. Buyer Discovery Rule

Stores returned in `/stores/nearby` must satisfy:

```sql
status = 'APPROVED' AND is_active = true AND deleted_at IS NULL
```

Draft or pending stores are never leaked via API.

---

## 7. Delhi NCR Launch

Initial seed includes Delhi NCR city with zones (South Delhi, Gurgaon, Noida, Ghaziabad, Faridabad) and sample service areas per zone. Merchants map stores to zones; optional fine-grained `store_service_areas` for hyperlocal delivery polygons.
