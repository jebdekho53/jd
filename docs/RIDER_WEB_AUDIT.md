# Rider Web — UI gap audit and build-out

Audit taken 2026-07-23 against `buyer-web`, `merchant-web`, and `admin-web`; the
gaps it found were then closed in the same pass.

## Scale

| App | Routes | TSX lines |
| --- | ---: | ---: |
| buyer-web | 57 | 20,126 |
| admin-web | 64 | 16,153 |
| merchant-web | 39 | 15,319 |
| rider-web (before) | 18 | 2,343 |
| **rider-web (after)** | **30** | **6,430** |

## What was wrong, and what was done

### Signup was undiscoverable

`/login` said "Sign in with your *registered* mobile number" and offered nothing
else. The signup form lives at `/onboarding`, which redirects signed-out
visitors straight back to `/login` — so a new rider had no visible way in.

Login now says "Sign in or sign up", explains the three-step flow
(OTP → profile → KYC) inline, and carries a footer to the public pages. A
`/about` landing page explains the programme for prospective partners.

### No auth guard on captain pages

`/shifts`, `/incentives`, `/training`, `/fleet`, `/kyc`, `/notifications`
rendered in full for signed-out visitors, including a live "Start shift" button
that could only ever 401.

Fixed first by a guard inside `CaptainPageShell`, then properly by the route
group described below — the shell version still let a page's own `useQuery` calls
fire before it mounted.

### `/cod` was a lie

It rendered the earnings tab. The API (`POST /rider/finance/cod/submit`) already
supported partial deposits with pro-rata allocation and mismatch tracking, but
the UI only ever submitted the full expected amount for every order at once, and
never showed which orders were in the balance.

`/cod` is now a real page: per-order breakdown, order selection, editable deposit
amount, over/short mismatch warning, and a deposit note. The duplicate submit
form inside the earnings tab was removed in favour of a link to it.

### No public or legal pages at all

buyer-web has `/about`, `/help`, `/faq`, `/terms`, `/privacy`, `/contact`,
`/refund-policy`, `/data-deletion`. merchant-web has a whole `(marketing)` group.
rider-web had none — no partner privacy page and no account-deletion page, which
would have blocked the Play Store listing.

Added `/about`, `/help`, `/faq`, `/contact`, `/payouts`, `/privacy`,
`/data-deletion`, all on a shared `PublicPageShell` that renders without a
session. `/agreement` was moved onto the same shell; it still renders from the
API legal registry, so the words a rider ticks and the words they can re-read
cannot drift.

The partner privacy page is rider-specific on purpose — continuous GPS
collection while online, who can see live position, KYC document visibility, and
COD record retention are the things a rider actually needs told, and none of them
are covered by the platform-wide policy.

### No onboarding status page

A rider signed up, uploaded KYC, and then had no view of where the application
stood. `/onboarding/status` now shows the stage, the per-document state with the
rejection reason against the specific document, a progress checklist, and the
profile as submitted. The home-screen KYC banner links to it.

### Account was one tab, not a section

There was no way to edit your name or vehicle details after signup — the API had
no endpoint for it at all.

- Added `PATCH /rider/profile` (`UpdateRiderProfileDto`,
  `RiderOnboardingService.updateProfile`) plus the rider-web proxy route.
- `/account/edit` — name and vehicle details.
- `/account/security` — how sign-in works, agreement acceptance history from
  `GET /legal/acceptances`, account closure, sign out.
- `/account/bank` — the payout screen as a real route.

Approval state is deliberately left alone by a profile edit: a rider mid-shift
must not be knocked offline by a typo fix. Where the vehicle identity itself
changed, the response flags `vehicleChanged` and the UI tells the rider to
re-upload the matching RC or licence. **This is a policy choice — if compliance
would rather a vehicle change force re-approval, it belongs in `updateProfile`.**

### PWA was installable but had no offline story

rider-web shipped a manifest and nothing else: no service worker, no offline
fallback. Riders are the users most likely to be on a dead network mid-delivery,
and they got a blank Chrome error page.

Added the serwist setup buyer-web already uses, sized for this app:

- The shell (documents, JS/CSS, fonts, icons) is cached so the app opens offline.
- **No rider data is cached** — not orders, not COD balances, not earnings. A
  rider acting on a stale delivery or a stale cash figure is worse than a rider
  seeing an error and retrying.
- `/offline` explains what is and is not happening while disconnected.
- A persistent red strip shows when the device is offline, because a rider who
  does not notice will keep tapping through a delivery and assume it registered.

The push handler came later in the same pass, once the API had somewhere to
subscribe to — see below.

### Fleet page was a stub

47 lines that bypassed `lib/api.ts` with an untyped `fetchFleet`, printed the
batch as `#1 — ORDER123`, and reduced the route to one line of text.

`getRiderBatch` now selects the pickup and drop geography, and the page renders a
real stop sequence: order link, status, store and drop addresses, a COD flag per
stop, and per-stop navigation links. It goes through typed `lib/api.ts` like
everything else. `mapsHref` moved to `lib/rider-helpers.ts` so the home screen
and the fleet page share one implementation.

### Empty and error states rendered blank

Several panels tested `data?.length === 0`, which is false when `data` is
`undefined` — so a failed query rendered a silently blank panel, identical to
"nothing here yet". Added a `QueryList` primitive that renders all four states
and applied it to shifts, incentives, training, notifications, and the support
tab.

### Crawlers had no instructions

The new public pages were crawlable with no `robots.txt` and no sitemap, so
`/login`, `/cod`, and `/account/*` were as indexable as `/about`.

`app/robots.ts` now allows only the eight public paths and disallows the rest,
`app/sitemap.ts` lists them, and the root layout defaults every route to
`noindex` — a disallow alone does not stop an externally-linked URL being
indexed, so the public pages opt back in individually.

### Tabs were not pages, and the guard ran too late

`/orders`, `/earnings`, `/account`, `/support` were 9-line wrappers rendering one
1,014-line `rider-home.tsx` with a different `initialTab`. Sub-views lived in
component state, so nothing deep-linked, and each route mounted the entire home
screen's query set.

That file is gone. It is now:

- `app/(rider)/layout.tsx` — one route group holding every signed-in route. The
  session guard wraps `children` here, so a page's queries cannot fire before the
  session resolves (the previous in-page guard still leaked a burst of 401s on a
  signed-out visit). The bottom nav lives here too instead of once per page.
- `features/rider/captain-chrome.tsx` — the shared header, online toggle, and
  standing banners. It owns the GPS watcher, so location streaming survives
  navigation between tabs.
- `features/rider/tabs/*.tsx` — one self-contained component per tab.
- `features/rider/{order-detail,support-ticket-detail,handover-otp-form,order-card}.tsx`
  and `use-order-actions.ts` / `use-rider-gps.ts` for the shared pieces.

Cross-tab state became navigation: opening an order is `/orders/:id`, reporting
an issue is `/support?orderId=…`, a ticket is `/support/:id`.

The account tab also gained the rating breakdown it was missing — a score, stars,
a bar, and what the number means for account standing.

### Riders got no push notifications

`modules/push` was buyer-only, so delivery offers reached a rider only while the
app was open on screen — and offers expire on a timer.

- `PushSubscriptionService` (renamed from `BuyerPushSubscriptionService`, which
  was already role-agnostic — subscriptions are keyed by userId).
- `RiderPushController` at `rider/notifications/push` — status, subscribe,
  unsubscribe.
- `RiderPushNotificationService` with offer, KYC-decision, payout, COD-reminder,
  and support-reply notifications. No preference gate: every rider notification
  is operational.
- Wired at the two points that matter: `finishAssignment` in
  `rider-assignment.service.ts` fires the offer push (not awaited — a slow push
  endpoint must not eat into the rider's response window), and
  `adminApproveDocument` / `adminRejectDocument` fire the KYC decision.
- Client: push and notificationclick handlers in `app/sw.ts` (same-origin URLs
  only — the URL arrives over the push channel), a `PushToggle` on
  `/notifications`, and a banner that appears only once a rider is online and
  actually losing offers by having it off.

**Not yet live:** `WEB_PUSH_PUBLIC_KEY` / `WEB_PUSH_PRIVATE_KEY` are not set in
`.env.production`, so `WebPushService.isConfigured()` is false and nothing sends.
The UI says so rather than pretending. Generate a VAPID pair with
`npx web-push generate-vapid-keys` and set both, plus `WEB_PUSH_SUBJECT`. This
also affects buyer push, which has been dormant for the same reason.

## Remaining gaps

1. **VAPID keys are not configured** — see above. Until they are, push is built
   but silent.
2. **No background location.** The PWA only streams GPS while it is open. This is
   the one thing the removed Expo app could have done better, and there is no
   web equivalent.
3. **No device QA.** Nothing here has been validated on a physical Android phone
   over a real network.
