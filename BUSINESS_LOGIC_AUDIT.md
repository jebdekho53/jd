# JebDekho Business Logic Audit Report

**Date:** 2026-06-29  
**Scope:** Payment/refund integrity, Shadowfax settlement, merchant approval, webhooks, distributed locks, fraud engine, financial reconciliation  
**Status:** Production-critical gaps addressed (additive changes only)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall production readiness** | **High** (financial integrity path closed) |
| **Critical gaps fixed** | 4 (refund-before-Razorpay, Shadowfax settlement, merchant role gate, webhook dedup) |
| **API breaking changes** | **None** — all changes additive |
| **Test suites** | API 118 passed / 496 tests |
| **Migration** | `20260628180000_business_integrity` |

This release closes the highest-risk business gaps identified after the OWASP audit: orders are no longer marked `REFUNDED` without Razorpay confirmation, Shadowfax `DELIVERED` webhooks now trigger the same settlement/completion path as own-fleet riders, merchant `MERCHANT` role is deferred until admin approval, and webhooks/crons are protected against duplicate processing.

---

## Root Causes Addressed

### 1. Refund integrity (Critical)
**Root cause:** `OrderService.initiateRefund()` updated DB to `REFUNDED` without calling `RazorpayService.createRefund()`.  
**Fix:** New `OrderRefundService` — Razorpay API first → verify → ledger → GST credit note → wallet → notification → then `REFUNDED`.

### 2. Shadowfax settlement (High)
**Root cause:** `DeliveryOrchestratorService` stopped at `OrderStatus.DELIVERED`; finance hooks lived only in `DeliveryService` (own-fleet).  
**Fix:** Shared `OrderDeliveredHandlerService` invoked from both rider delivery and provider orchestrator (idempotent via Redis lock + `settlementLedger` unique).

### 3. Merchant approval (High)
**Root cause:** `POST /merchant/profile` and onboarding submit granted `MERCHANT` role before admin approval.  
**Fix:** Role removed from `createProfile()` and submit; granted via `approveApplication()` and `approveStore()` only. Existing merchants retain role.

### 4. Webhook replay (Medium)
**Root cause:** Razorpay had no event-id dedup table; Shadowfax dedup was check-then-create (race).  
**Fix:** Generic `WebhookEvent` table + `WebhookDedupService` with atomic create / P2002 handling.

### 5. Cron duplicate execution (Medium)
**Root cause:** API runs with `replicas: 2` but crons had no leader election.  
**Fix:** `DistributedLockService` (Redis SET NX) on settlement, refund retry, inventory release crons.

### 6. Fraud visibility (Low–Medium)
**Root cause:** No automated abuse detection beyond ad-hoc finance alerts.  
**Fix:** `FraudEngineService` — hourly scans, admin alerts only (no auto-block).

---

## Files Changed

### Database / Prisma
- `prisma/schema.prisma` — `WebhookEvent`, `OrderRefund`, `CodReconciliation.providerType`, `FinanceAlertType` extensions
- `prisma/migrations/20260628180000_business_integrity/migration.sql`

### API — Infrastructure
- `apps/api/src/redis/distributed-lock.service.ts` (+ spec)
- `apps/api/src/common/webhooks/webhook-dedup.service.ts` (+ spec, module)

### API — Refunds
- `apps/api/src/modules/payment/order-refund.service.ts` (+ spec)
- `apps/api/src/modules/payment/refund-retry.scheduler.ts`
- `apps/api/src/modules/payment/payment.service.ts` — webhook dedup + `refund.processed`
- `apps/api/src/modules/order/order.service.ts` — delegates to `OrderRefundService`
- `apps/api/src/modules/finance/admin-finance.controller.ts` — `GET /admin/finance/refunds/failed`

### API — Settlement / Delivery
- `apps/api/src/modules/order/order-delivered-handler.service.ts`
- `apps/api/src/modules/order/order-fulfillment.module.ts`
- `apps/api/src/modules/rider/delivery.service.ts` — uses shared handler
- `apps/api/src/modules/logistics/delivery-orchestrator.service.ts` — Shadowfax DELIVERED → handler
- `apps/api/src/modules/finance/cod-reconciliation.service.ts` — provider COD support

### API — Merchant approval
- `apps/api/src/modules/merchant/merchant.service.ts`
- `apps/api/src/modules/merchant-onboarding/merchant-onboarding.service.ts`
- `apps/api/src/modules/admin/admin-store.service.ts`

### API — Fraud / Locks
- `apps/api/src/modules/finance/fraud-engine.service.ts`
- `apps/api/src/modules/finance/finance-alert.service.ts`
- `apps/api/src/modules/settlement/settlement-automation.service.ts`
- `apps/api/src/modules/finance/settlement-batch.service.ts`
- `apps/api/src/modules/checkout/reservation.service.ts`

### Module wiring
- `apps/api/src/app.module.ts`, `redis.module.ts`, `payment.module.ts`, `finance.module.ts`, `logistics.module.ts`, `rider.module.ts`, `order.module.ts`

---

## Database Migration

```bash
pnpm db:migrate:prod   # production
pnpm db:migrate        # local dev
```

Creates:
- `webhook_events` — provider + eventId unique
- `order_refunds` — idempotent refund records with retry metadata
- `cod_reconciliations.provider_type` — nullable `rider_profile_id`
- Extended `FinanceAlertType` enum

---

## API Changes (Additive)

| Endpoint | Change |
|----------|--------|
| `POST /payments/webhook` | Handles `refund.processed` / `refund.created`; dedup via `WebhookEvent` |
| `GET /admin/finance/refunds/failed` | **New** — failed refund dashboard |
| Cancellation flows | Same endpoints; now call Razorpay before `REFUNDED` |

No existing response shapes removed. Merchant onboarding endpoints unchanged; unauthorized merchants lose dashboard access until approval (intended).

---

## Build & Test Results

| Check | Result |
|-------|--------|
| `pnpm --filter @jebdekho/api build` | ✅ Pass |
| `pnpm --filter @jebdekho/api test` | ✅ 118 suites / 496 tests |
| `pnpm build` | ✅ All 7 apps |
| TypeScript | ✅ Zero errors |

---

## Manual QA

### Refund checklist
- [ ] Cancel paid Razorpay order → Razorpay dashboard shows refund before order `REFUNDED`
- [ ] Duplicate cancel/refund request → idempotent (same `order-cancel-refund:{orderId}`)
- [ ] Simulate Razorpay failure → order stays cancelled, refund `FAILED`, appears in `/admin/finance/refunds/failed`
- [ ] `refund.processed` webhook → reconciles pending refund
- [ ] Wallet portion restored on mixed `WALLET_RAZORPAY` orders
- [ ] GST credit note generated after refund

### Settlement checklist
- [ ] Shadowfax DELIVERED webhook → `settlementLedger` created (PENDING)
- [ ] Duplicate DELIVERED webhook → no duplicate ledger (idempotent)
- [ ] Order reaches `COMPLETED` after provider delivery
- [ ] GST invoice generated
- [ ] COD Shadowfax order → `cod_reconciliations` with `provider_type=SHADOWFAX`

### Merchant approval checklist
- [ ] New signup + profile → no `MERCHANT` role until admin approves
- [ ] Existing approved merchants → unchanged access
- [ ] `POST /admin/store-approvals/:id/approve` → grants role
- [ ] `POST /admin/merchant-applications/:id/approve` → grants role

### Webhook / lock checklist
- [ ] Replay same Razorpay `event.id` → 200, no double side effects
- [ ] Two API replicas → only one cron run per interval (check logs for "Lock busy")

### Fraud checklist
- [ ] Buyer with 5+ refunds in 30d → `FRAUD_HIGH_RISK_BUYER` alert in admin finance alerts
- [ ] No automatic order blocks

---

## Financial Reconciliation Checklist

- [ ] Every delivered order has `settlementLedger` + `OrderFinancialSnapshot`
- [ ] Every Razorpay refund has matching `order_refunds.razorpay_refund_id` + `payment_transactions`
- [ ] Ledger `refund:{orderId}` journal matches refund amount
- [ ] Credit note exists when GST invoice existed pre-refund
- [ ] Merchant wallet `pendingBalance` increments only once per delivered order

---

## Remaining Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Not all 22 crons have Redis locks yet | Medium | Settlement, refund, inventory covered; extend pattern to CRM/AI crons |
| Email verification still password-based | Medium | Product decision — no OTP flow added |
| `StoreBusinessType` not copied on onboarding | Medium | Food vertical discovery may need manual admin step |
| Claim refunds vs cancellation refunds | Low | Two paths coexist; both now Razorpay-first for online portion |
| Provider COD remittance workflow | Medium | Records created; admin remittance UI for provider COD TBD |

---

## Production Deployment Steps

1. **Backup database**
2. `git pull` and `pnpm install`
3. `pnpm db:migrate:prod`
4. `pnpm db:generate`
5. `./deploy/scripts/build-api.sh` or `pnpm build`
6. Rolling restart API replicas (Redis required for locks)
7. Verify `RAZORPAY_WEBHOOK_SECRET` and enable `refund.processed` in Razorpay dashboard
8. Smoke test: cancel test order, Shadowfax test webhook, admin failed refunds endpoint

---

## Rollback Plan

1. **Code:** `git revert` to previous release tag; redeploy API + web apps
2. **Database:** Migration is additive — rollback does not require dropping tables. If needed:
   - Old code ignores `webhook_events` / `order_refunds` safely
   - Do **not** drop tables if refunds were processed post-migrate
3. **Redis:** No persistent state; safe to clear lock keys
4. **Razorpay:** Refunds already issued cannot be rolled back in code — reconcile manually in dashboard

---

## Launch Checklist

- [ ] Migration applied on production
- [ ] Redis reachable from all API replicas
- [ ] Razorpay webhook events: `payment.captured`, `payment.failed`, `refund.processed`
- [ ] Shadowfax `SHADOWFAX_WEBHOOK_SECRET` set
- [ ] Admin team briefed on failed refunds dashboard + fraud alerts
- [ ] Finance team validates sample order end-to-end (pay → deliver → settle → refund)

---

*Generated as part of business-critical production hardening. Re-audit after major payment or logistics changes.*
