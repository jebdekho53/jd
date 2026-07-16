# JebDekho — Rider & Delivery Status (Canonical)

> **Canonical, evidence-based status** for the rider/captain and delivery domain.
> Supersedes rider/delivery claims in older planning docs
> ([Development Roadmap](architecture/07-development-roadmap.md),
> [Feature Audit](FEATURE_AUDIT_REPORT.md)).
> **Last verified:** 16 July 2026 · **Branch:** `codex/rider-captain-completion` ·
> **HEAD:** `dcc0071 feat(rider): complete captain app and admin ops`.
>
> Verified against actual code, Prisma schema, tests and the working tree — not
> prior summaries. Status labels: **COMPLETE**, **MOSTLY COMPLETE**, **PARTIAL**,
> **NOT STARTED**, **BLOCKED** (external dependency), **NEEDS VERIFICATION**.

---

## 1. Executive summary

The rider/delivery **backend domain is production-grade and largely COMPLETE**: a
provider-neutral logistics layer, in-house (own-fleet) rider assignment with
race-safe offers, a server-side delivery state machine, pickup/delivery OTP
handover with attempt limiting and audit, a COD cash-acknowledgment gate, an
immutable-ledger-backed earnings/payout path (Razorpay Route), COD reconciliation,
authenticated & scoped WebSocket tracking, and admin rider operations.

The **user-facing OTP handover flow is now wired end-to-end** across API →
rider-web BFF → rider-mobile / rider-web captain PWA, plus buyer and merchant UI,
and is covered by automated tests.

**What is NOT yet done and gates a real pilot** is validation, not code: the
rider **mobile app has no test harness, an existing baseline typecheck error, and
no physical-device / background-location / staging end-to-end validation**; the
**delivery-handover Prisma migration is still pending (unapplied)**; **Expo/FCM
push credentials and Shadowfax production credentials are not configured**; and a
**return-to-store workflow does not exist** (delivery failure only marks
`DELIVERY_FAILED`).

Treat the rider system as **code-complete for the happy path, pending
device/staging validation and operational hardening before a pilot.**

---

## 2. Current architecture

- **API:** NestJS monolith (`apps/api`), 303 Prisma models, Redis, RS256 JWT +
  refresh rotation + RBAC.
- **Delivery domain:** separate `Delivery` lifecycle (enum `DeliveryStatus`) mapped
  to commerce `OrderStatus`; `DeliveryAssignment`, `DeliveryTracking`,
  `RiderLocation`, `RiderProfile`/`RiderDocument`/`RiderShift`/`RiderIncentive`,
  `DeliveryProvider`/`ProviderShipment`/`ProviderWebhook`.
- **Provider-neutral logistics** (`apps/api/src/modules/logistics`): a registry +
  orchestrator selecting a provider per order; adapters implement a common
  `ILogisticsProvider` interface.
- **Own fleet:** dispatched through `RiderAssignmentService` (not the logistics
  provider API); the `OwnFleetProvider` adapter is a health-check placeholder by
  design.
- **Real-time:** authenticated Socket.IO gateways (`delivery-tracking.gateway`,
  `rider-assignment.gateway`, `fleet-os.gateway`) guarded by
  `common/websocket/ws-auth.service` (unauthenticated sockets are rejected).
- **Rider surfaces:** `apps/rider-web` serves **both** the mobile BFF
  (`/api/rider/*` → NestJS `/rider/*`) **and** the captain PWA UI; `apps/rider-mobile`
  is the Expo React Native app that talks to the BFF.

---

## 3. Completed features (COMPLETE)

Verified in code + tests unless noted.

| Feature | Evidence |
|---|---|
| Provider-neutral delivery architecture | `logistics/logistics-provider.registry.ts`, `delivery-orchestrator.service.ts` |
| Own-fleet dispatch via assignment engine | `rider-assignment/rider-assignment.service.ts`; `OwnFleetProvider` placeholder |
| Race-safe rider assignment & offers | `rider-assignment.service.ts`, `delivery_assignments`, `rider-assignment.service.spec.ts` |
| Server-side delivery state machine | `rider/delivery.service.ts` (`DELIVERY_NEXT`, `assertCanAdvance`), `delivery.service.spec.ts` |
| Pickup OTP generation + verification | `delivery.service.ts#verifyPickup`, `delivery-otp.util.ts`, spec cases |
| Delivery OTP generation + verification | `delivery.service.ts#verifyDelivery`, spec cases |
| OTP attempt-limiting + audit events | `HANDOVER_OTP_MAX_ATTEMPTS`, `PICKUP/DELIVERY_OTP_FAILED/VERIFIED` audit |
| COD cash-collected acknowledgment gate | `delivery.service.ts#assertCodAcknowledged` (amount is server `order.totalAmount`) |
| OTP sanitized from rider/generic payloads | `sanitizeForRider`; `ORDER_DETAIL_SELECT` untouched; `orders.spec.ts` |
| Cross-buyer / cross-merchant OTP access blocked | `order.service.ts#getBuyerDeliveryOtp/getMerchantPickupOtp`, `order.service.spec.ts` |
| Rider KYC / documents | `RiderProfile`, `RiderDocument`, admin KYC review |
| Rider shifts / online-offline | `RiderShift`, `rider-captain.service.ts` |
| Rider incentives | `RiderIncentive`, `RiderIncentiveProgress` |
| COD reconciliation infrastructure | `finance/cod-reconciliation.service.ts`, `CodReconciliation` |
| Rider earnings / payouts via Razorpay Route | `finance/rider-payout.service.ts`, `rider-payout-route.spec.ts` |
| Live location + ETA infrastructure | `delivery-tracking.service.ts`, `RiderLocation`, Redis current-location |
| Authenticated & scoped WebSocket events | `delivery-tracking.gateway.ts` + `ws-auth.service` |
| Admin rider/captain operations | `rider/admin-rider.controller.ts`, admin-web `features/riders/*` |
| Buyer delivery-OTP UI | `buyer-web` `delivery-otp-card.tsx` + BFF `delivery-otp` route |
| Merchant pickup-OTP UI | `merchant-web` `pickup-otp-banner.tsx` + BFF `pickup-otp` route |
| Rider-mobile OTP entry (pickup/delivery + COD ack) | `rider-mobile` `handover-otp-panel.tsx`, `hooks/use-delivery.ts` |
| Rider-web captain OTP entry | `rider-web` `features/rider/rider-home.tsx` (`HandoverOtpForm`) |
| Typed BFF routes + API clients | rider-web `verify-pickup/verify-delivery`; buyer/merchant OTP clients |

---

## 4. Partially completed features (MOSTLY COMPLETE / PARTIAL)

| Feature | Status | Gap |
|---|---|---|
| Rider mobile application | **PARTIAL** | Full happy-path code + OTP UI + offline queue + location + push wiring, but no test harness, a baseline typecheck error, and no device/staging validation. |
| Shadowfax integration | **MOSTLY COMPLETE / BLOCKED** | Real adapter + health/serviceability/webhook idempotency; **needs production credentials + webhook config** (`ENABLE_SHADOWFAX`, `SHADOWFAX_*`). |
| Borzo integration | **NEEDS VERIFICATION** | Adapter present (`providers/borzo/borzo.provider.ts`), enabled by flag; **not validated against the live provider.** |
| Buyer delivery integration | **MOSTLY COMPLETE** | Assignment/status/rider panel/ETA/live map/OTP card present; not device/staging validated end-to-end. |
| Merchant delivery integration | **MOSTLY COMPLETE** | Prep/ready/assignment/arrival/pickup-OTP/handover present; no return-to-store UI (no backend). |
| Admin rider operations | **MOSTLY COMPLETE** | KYC review, incentives, live ops, dispatch present; manual reassignment / provider-switch-before-pickup controls **NEED VERIFICATION**. |
| Rider push notifications | **PARTIAL** | `rider-mobile/services/notifications.ts` + realtime provider wire tokens; **Expo/FCM credentials not configured**, not device-validated. |
| Background / live location on device | **NEEDS VERIFICATION** | Server + client code exist; **screen-locked background tracking not validated on a real device.** |

---

## 5. Remaining work

See [§10 Pilot checklist](#10-pilot-readiness-checklist) and
[§11 Rollout checklist](#11-production-rollout-checklist). Highest-impact gaps:

- **Return-to-store workflow — NOT STARTED.** No `RETURN_TO_STORE*` states or flow
  exist; `markFailed` only sets order `DELIVERY_FAILED` and releases the rider.
- **Rider-mobile test harness — NOT STARTED.** `apps/rider-mobile` has no `test`
  script and no jest/vitest config.
- **Baseline typecheck error** in `apps/rider-mobile/services/live-location.service.ts:174`
  (pre-existing; present before OTP work).
- **Porter / Delhivery — NOT STARTED** (stub adapters throw `ProviderNotImplementedError`).

---

## 6. External blockers (BLOCKED)

| Blocker | Impact |
|---|---|
| Shadowfax **production** credentials + webhook config | External-provider fallback can't be validated live |
| **Expo/FCM push credentials** + Android/iOS signing | No production push; no store build |
| Physical Android device(s) for QA | Cannot validate delivery/location/OTP on-device |
| Staging environment for full E2E order run | Cannot validate one real prepaid + one COD delivery end-to-end |

*(Razorpay Route live credentials are required for real rider payouts; test-mode
code paths are covered by specs.)*

---

## 7. Validation evidence

Commands run against this branch (16 July 2026):

- `pnpm exec prisma validate` → **valid**.
- API `pnpm exec tsc --noEmit` → **clean**.
- API `jest order.service.spec delivery.service.spec` → **59 passed** (incl. OTP
  verification, COD gate, and cross-buyer/cross-merchant OTP-scoping cases).
- Earlier full rider suites (`rider`, `rider-assignment`) → **passing**.
- `rider-web` `tsc` clean + `jest lib/transforms/orders.spec.ts` → **3 passed**
  (asserts raw OTP never leaks to the rider payload).
- `buyer-web` `tsc` clean + `jest delivery-otp-visibility` → **4 passed**.
- `merchant-web` `tsc` clean + `jest pickup-otp-visibility` → **3 passed**.
- `rider-mobile` `tsc --noEmit` → **no new errors** (1 pre-existing baseline error).

**Not yet validated:** any physical-device run, background location with the
screen locked, app-restart/network-reconnect recovery, and a full staging E2E
delivery (prepaid or COD).

---

## 8. Security status

- Rider never receives raw pickup/delivery OTPs (`sanitizeForRider`; transform test).
- Buyer/merchant OTP endpoints are ownership-scoped; cross-access returns
  `NotFound`/`Forbidden` (tests).
- OTP is one-time-use, attempt-limited, audited; codes are never logged, put in
  URLs, localStorage or analytics.
- COD amount is server-authoritative; the client only sends a boolean acknowledgment.
- Legacy plain `picked-up`/`delivered` endpoints refuse to bypass an unverified OTP.
- WebSocket connections are authenticated and scoped.
- **To confirm for production:** WebSocket allowed origins / auth settings in the
  production env (NEEDS VERIFICATION).

---

## 9. Database migration status

- **Migration:** `prisma/migrations/20260808000100_delivery_handover_otp`.
- **State:** **PENDING** — `prisma migrate status` lists it as not yet applied to
  any database.
- **Ordering:** its timestamp intentionally follows
  `20260808000000_rider_captain_suite` so it applies **after** that
  already-committed migration (Prisma applies by lexicographic directory name). It
  was renamed from a future-dated `20260809000000` while still unapplied/uncommitted.
- **Backfill:** **none required** — all six added columns on `deliveries`
  (`pickup_otp`, `pickup_verified_at`, `pickup_otp_attempts`, `delivery_otp`,
  `delivery_verified_at`, `delivery_otp_attempts`) are nullable or defaulted, so
  existing/completed rows stay valid.
- **Deploy order:** apply the migration **before** deploying the new API build.

---

## 10. Pilot readiness checklist

**P0 — required before a rider production pilot:**

- [ ] Apply and validate the pending `20260808000100_delivery_handover_otp` migration.
- [ ] Add a rider-mobile test runner/harness (jest + expo preset).
- [ ] Fix the baseline typecheck error in `rider-mobile/services/live-location.service.ts:174`.
- [ ] Configure Expo/FCM push credentials; validate a push on-device.
- [ ] Run real Android device QA of the full active-delivery flow.
- [ ] Validate background location with the screen locked.
- [ ] Validate app-restart and network-reconnect recovery (no false "delivered", no duplicate actions).
- [ ] Staging E2E: one complete **prepaid** delivery (assign → pickup OTP → delivery OTP → delivered).
- [ ] Staging E2E: one complete **COD** delivery (cash acknowledged; cash liability recorded separately).
- [ ] Validate cancellation before pickup (offer/assignment cancelled; refund state updated).
- [ ] Validate delivery failure path (currently `DELIVERY_FAILED`; see return-to-store gap).
- [ ] Verify no duplicate internal/external provider dispatch under fallback.
- [ ] Verify production WebSocket authentication/origin settings.

---

## 11. Production rollout checklist

**P1 — required before wider city rollout:**

- [ ] Rider-operations monitoring & dashboards.
- [ ] Provider-fallback failure alerting.
- [ ] COD discrepancy / mismatch alerts.
- [ ] Rider location-stale alerts.
- [ ] Operational analytics for delivery SLAs.
- [ ] Rider support/escalation tooling.
- [ ] Performance / load tests for assignment + tracking.
- [ ] Multi-zone pilot.
- [ ] App Store / Play Store release setup + signing.
- [ ] Shadowfax **production** credentials validated against a live shipment.

**Safe deployment sequence:**
1. Database migration (`db:migrate:prod`).
2. API deployment.
3. Web apps (buyer, merchant, admin, rider-web BFF/captain).
4. Rider mobile (after device QA + push credentials).
5. Controlled pilot (single zone, selected riders).
6. Monitoring + rollback ready.

---

## 12. Completion estimates

Implementation-weighted (security/operational items weighted above cosmetic UI),
not checkbox counts.

| Area | Estimate | Basis |
|---|---|---|
| Rider backend / domain | **~90% COMPLETE** | State machine, assignment, offers, OTP, COD gate, earnings, KYC, shifts implemented + tested; missing return-to-store + some ops controls |
| Rider mobile application | **~70% PARTIAL** | Full happy-path code + OTP/offline/location/push wiring; weighted down for no test harness, no device QA, baseline error, no store build |
| Buyer delivery integration | **~85% MOSTLY** | Tracking, ETA, rider panel, live map, OTP card, cancel/refund; not staging-validated |
| Merchant delivery integration | **~85% MOSTLY** | Prep/ready/assignment/arrival/pickup-OTP/handover; no return-to-store UI |
| Admin rider operations | **~80% MOSTLY** | KYC review, incentives, live ops; manual reassign/provider-switch controls need verification |
| External logistics integration | **~55% PARTIAL** | Shadowfax real (blocked on creds), Borzo unvalidated, Porter/Delhivery stubs; orchestration complete |
| Automated test coverage | **~65%** | 165 API spec files (strong on rider/delivery/OTP/order); targeted web tests; no rider-mobile tests, no E2E in repo |
| Physical-device / staging validation | **~10% NOT STARTED** | No device QA, no staging E2E, no background-location test |
| **Overall rider pilot readiness** | **~65%** | Code ready; blocked by device validation, push creds, migration apply, staging E2E |
| **Overall production rollout readiness** | **~55%** | Adds monitoring/alerting, load tests, store release, live provider validation |

---

## 13. Recommended next implementation order

1. Apply the pending handover-OTP migration on staging; smoke-test verify endpoints.
2. Stand up a rider-mobile jest/expo test harness; fix the `live-location.service.ts:174` baseline error.
3. Configure Expo/FCM push credentials; validate a push on-device.
4. Physical-device QA of the active-delivery + OTP + background-location flow.
5. Staging E2E: prepaid delivery, then COD delivery, then cancel-before-pickup.
6. Implement the **return-to-store** workflow (states, rider/merchant/admin surfaces) — currently absent.
7. Verify no dual internal/external dispatch under Shadowfax fallback; confirm prod WebSocket origin/auth.
8. Add rider-ops monitoring + provider-fallback / COD-mismatch / location-stale alerting.
9. Validate Shadowfax against a live shipment once production credentials arrive.
10. App Store / Play Store release setup and controlled single-zone pilot.
