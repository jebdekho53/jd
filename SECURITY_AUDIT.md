# JebDekho Security Audit Report

**Date:** 2026-06-28  
**Scope:** API (NestJS), Buyer/Merchant/Admin Web, PWA, Shadowfax, Razorpay, uploads, AI product, auth  
**Standards:** OWASP Top 10 2021, OWASP API Security Top 10, OWASP ASVS L2, CWE Top 25

---

## Executive summary

| Metric | Value |
|--------|-------|
| **Overall risk score (post-fix)** | **Medium** (was High) |
| **Critical issues fixed** | 0 exploitable criticals in authz path; payment refund gap documented |
| **High issues fixed** | 6 |
| **Medium issues fixed** | 12 |
| **Files modified** | 35+ |
| **Tests added** | 3 spec files |
| **Build status** | All 7 apps build successfully (`pnpm build`) |
| **Test status** | All suites pass (`pnpm test` — API 489, buyer-web, web-config, etc.) |

This audit identified real vulnerabilities across authorization, webhooks, uploads, PWA caching, and infrastructure headers. Security fixes were applied **without changing business logic or UI design**.

---

## Risk score

| Area | Before | After | Notes |
|------|--------|-------|-------|
| Authentication | High | Low | Live JWT revalidation on every request |
| Authorization (IDOR) | High | Low | Merchant finance IDOR closed |
| Webhooks | Medium | Low–Med | Shadowfax fail-closed; Razorpay atomic PAID transition |
| Uploads / SSRF | High | Low | Trusted upload URLs + SSRF blocks on product images |
| Frontends / PWA | Medium | Low | CSP headers, no SW API cache, notification URL allowlist |
| Payments (refund) | High | **Open** | Cancellation refund not wired to Razorpay API (business flow) |

---

## Attack surface

```
Internet
  ├── Buyer / Merchant / Admin Next.js (CSP, restricted image hosts)
  ├── PWA Service Worker (no authenticated API cache)
  ├── API /api/v1
  │     ├── JWT (RS256, live DB roles/status/blacklist)
  │     ├── Public: catalog, SEO, webhooks (signed), geocode (throttled)
  │     ├── Razorpay webhook (HMAC + atomic status)
  │     └── Shadowfax webhook (HMAC/Token, fail-closed in prod)
  ├── WebSockets (CORS restricted on fleet/rider-assignment)
  └── Static uploads (/uploads — MIME validation, trusted URL gate on docs)
```

---

## Fixes applied

### Authentication & session (A07, API2)

| Issue | Severity | Fix | Files |
|-------|----------|-----|-------|
| Stale JWT after suspension/role revoke | High | `JwtStrategy` + `TokenService.resolveLiveRequestUser()` reloads status, roles, permissions, merchant blacklist from DB | `jwt.strategy.ts`, `token.service.ts` |
| Logout revokes another user's refresh token | Medium | `revokeByRawToken(token, expectedUserId)` | `token.service.ts`, `auth.service.ts`, `admin-auth.service.ts` |

### Authorization / IDOR (A01, API1)

| Issue | Severity | Fix | Files |
|-------|----------|-----|-------|
| Merchant finance order breakdown IDOR | High | `getOrderFinancialsForMerchant()` verifies store ownership | `order-financials.service.ts`, `merchant-finance.controller.ts` |
| Idempotency key cross-user reuse | Medium | Return 409 when key belongs to another user | `idempotency.interceptor.ts` |

### Webhooks & payments (A04, API6)

| Issue | Severity | Fix | Files |
|-------|----------|-----|-------|
| Shadowfax webhook auth bypass without secret | High | Fail closed unless `ALLOW_INSECURE_WEBHOOKS=true` in non-prod | `shadowfax-webhook.service.ts` |
| Razorpay webhook payment race | Medium | `updateMany` where status ≠ PAID | `payment.service.ts` |
| Food checkout duplicate order race | High | Atomic `PENDING → PROCESSING` claim in transaction | `food-checkout.service.ts` |

### Input validation & uploads (A03, A10)

| Issue | Severity | Fix | Files |
|-------|----------|-----|-------|
| Arbitrary URL in verification documents (admin phishing) | High | `assertTrustedUploadUrl()` on store + category docs | `trusted-upload-url.util.ts`, `store.service.ts`, `store-category-request.service.ts` |
| Menu OCR arbitrary imageUrl | Medium | Same trusted upload validation | `menu-ocr.service.ts` |
| Product imageUrls SSRF | High | `assertSafeExternalHttpsUrl()` blocks private/metadata hosts | `safe-external-url.util.ts`, `product.service.ts` |
| Admin iframe XSS/phishing | Medium | `sandbox=""` on PDF iframes | `verification-documents-panel.tsx` |

### Infrastructure & PWA (A05)

| Issue | Severity | Fix | Files |
|-------|----------|-----|-------|
| Missing CSP / security headers on web apps | Medium | `nextSecurityHeaders()` on buyer/merchant/admin | `packages/web-config/src/security-headers.ts`, `next.config.ts` ×3 |
| Next.js image optimizer SSRF (`hostname: **`) | High | Restrict to `api.jebdekho.com/uploads` + optional upload host | `next.config.ts` ×3 |
| PWA cached authenticated API responses | Medium | All `/api/buyer` private; removed SW API cache rule | `lib/pwa/constants.ts`, `app/sw.ts` |
| Push notification open redirect | Low | Same-origin pathname only | `app/sw.ts` |
| WebSocket CORS `*` on fleet/rider | Medium | `wsGatewayCorsOptions()` | `fleet-os.gateway.ts`, `rider-assignment.gateway.ts` |
| Public geocode quota abuse | High | `@Throttle` 20/min on reverse geocode | `geocoding.controller.ts` |

---

## OWASP Top 10 2021 coverage

| # | Category | Status |
|---|----------|--------|
| A01 | Broken Access Control | **Fixed** IDOR, JWT live auth, idempotency |
| A02 | Cryptographic Failures | Keys in env; Maps key separation documented |
| A03 | Injection | Prisma parameterized; URL scheme blocks |
| A04 | Insecure Design | Checkout/webhook races mitigated |
| A05 | Security Misconfiguration | CSP, CORS WS, webhook fail-closed |
| A06 | Vulnerable Components | Out of scope (run `pnpm audit` separately) |
| A07 | Auth Failures | Live JWT validation, logout binding |
| A08 | Software/Data Integrity | Webhook HMAC verified |
| A09 | Logging Failures | No secrets logged in changed paths |
| A10 | SSRF | Product images + upload URL gates |

---

## Remaining risks (not fixed — business logic or out of scope)

| Issue | Severity | Reason |
|-------|----------|--------|
| Order cancellation marks REFUNDED without Razorpay `createRefund` | **Critical (financial)** | Requires payment integration change — not a config-only security patch |
| Shadowfax DELIVERED skips settlement/COD hooks | High | Shared delivered-handler refactor touches finance flow |
| Self-service `POST /merchant/profile` grants MERCHANT role | High | Product/onboarding policy decision |
| Global `JwtAuthGuard` not registered app-wide | Medium | Defense-in-depth; all sensitive routes currently guarded |
| Public `/health/db`, `/health/redis` | Low | Infra/network segmentation recommended |
| Public admin login stats | Low | Marketing data exposure |
| AI publish gates trust model `confidence` | Medium | Requires AI pipeline change |
| Upload re-encode via Sharp for all paths | Medium | Performance/storage tradeoff |
| Cron jobs without distributed locks | Medium | Infra: single worker or Redis lock |
| Razorpay webhook event-id dedup table | Medium | Schema migration needed |

---

## Tests added

| File | Covers |
|------|--------|
| `trusted-upload-url.util.spec.ts` | Upload URL allowlist |
| `order-financials.service.spec.ts` | Merchant finance IDOR |
| Existing: `ws-cors.util.spec.ts`, `category-governance` specs | CORS, governance |

Run: `pnpm --filter @jebdekho/api test`

---

## Manual QA checklist

### Auth
- [ ] Suspend user in admin → existing access token rejected within 1 request
- [ ] Blacklist merchant → API returns 401 on next request
- [ ] Logout with another user's refresh token → 403, victim session intact

### Finance IDOR
- [ ] Merchant A cannot `GET /merchant/finance/orders/{merchant-B-order-id}` (returns `data: null`)

### Uploads
- [ ] Store verification doc with `https://evil.com/x` → 400
- [ ] Product with `imageUrls: https://169.254.169.254/` → 400
- [ ] Menu OCR with non-upload URL → 400

### Webhooks
- [ ] Shadowfax POST without secret in production → 401
- [ ] Razorpay duplicate `payment.captured` → single PAID transition

### Food checkout
- [ ] Concurrent verify + webhook → single order created

### PWA / headers
- [ ] Buyer response includes `Content-Security-Policy`
- [ ] Service worker does not cache `/api/buyer/orders`
- [ ] Push notification with `data.url: https://evil.com` opens `/` only

### Geocoding
- [ ] >20 reverse geocode requests/min/IP → 429

---

## Deployment checklist

1. Set `SHADOWFAX_WEBHOOK_SECRET` in production (required).
2. Do **not** set `ALLOW_INSECURE_WEBHOOKS` in production.
3. Set `UPLOAD_PUBLIC_URL=https://api.jebdekho.com/uploads` (or CDN URL).
4. Optional: `NEXT_PUBLIC_UPLOAD_HOST` for dev/staging image optimizer.
5. Restrict Google Maps server key by IP; browser key by HTTP referrer.
6. Run `./deploy/scripts/build-api.sh` after pull.
7. Run full test suite: `pnpm test`
8. Verify CSP does not break Razorpay checkout or Google Maps (adjust CSP if needed in staging).

---

## Files modified (summary)

**API:** `jwt.strategy.ts`, `token.service.ts`, `auth.service.ts`, `admin-auth.service.ts`, `merchant-finance.controller.ts`, `order-financials.service.ts`, `idempotency.interceptor.ts`, `shadowfax-webhook.service.ts`, `payment.service.ts`, `food-checkout.service.ts`, `store.service.ts`, `store-category-request.service.ts`, `menu-ocr.service.ts`, `product.service.ts`, `geocoding.controller.ts`, `fleet-os.gateway.ts`, `rider-assignment.gateway.ts`, `trusted-upload-url.util.ts`, `safe-external-url.util.ts`, specs

**Web:** `buyer-web/next.config.ts`, `merchant-web/next.config.ts`, `admin-web/next.config.ts`, `buyer-web/app/sw.ts`, `buyer-web/lib/pwa/constants.ts`, `buyer-web/lib/pwa/constants.spec.ts`, `admin-web/.../verification-documents-panel.tsx`, `merchant-web/services/categories/categories-api.ts`, `merchant-web/features/categories/categories-page-content.tsx`

**Packages:** `packages/web-config/src/security-headers.ts`, `index.ts`

---

*Generated as part of OWASP security hardening. Re-audit after major feature releases or before PCI/compliance reviews.*
