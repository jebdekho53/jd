# Buyer Web V2 UI Upgrade

Complete UI/UX redesign for the JebDekho buyer web app. Information architecture is inspired by category-first grocery commerce (BigBasket-style browsing) while visual design uses **JebDekho brand colors only** — no third-party color or layout copying.

## Brand palette

| Token | Hex | Usage |
|-------|-----|--------|
| Surface cream | `#f1eedf`, `#f2efe0`, `#f4f1e2`, `#f0edde`, `#eeebda` | Page background, cards, section fills |
| Accent orange | `#F97316` | Primary CTA, nav active state, badges, links |
| Accent dark | `#EA580C`, `#C2410C` | Hover / gradient depth |

## New sitemap

```
/                          Home (discovery hub)
├── /stores                Store discovery
│   └── /stores/[slug]     Store detail + menu
├── /search                Product search (+ ?categoryId, ?q, ?deals=1)
├── /cart                  Cart (auth)
├── /checkout              Checkout (auth)
├── /orders                Order history (auth)
│   ├── /orders/[id]       Order detail
│   └── /orders/[id]/confirmation
├── /login                 OTP login (auth)
└── /onboarding            Profile + location setup (auth)
```

**Global navigation (mobile bottom bar + desktop header):** Home · Stores · Search · Cart · Orders

## Component tree

```
app/layout.tsx
└── QueryProvider
    └── Page routes
        ├── PageShell (unified shell — all buyer pages)
        │   ├── SiteHeader
        │   │   ├── Brand logo
        │   │   ├── Desktop nav (5 routes + cart badge)
        │   │   └── Login / Account
        │   ├── <main> page content
        │   └── MobileBottomNav (5 tabs + cart badge)
        │
        └── (s2)/layout.tsx → Sprint2Providers (auth, toast)

components/v2/
├── hero-banner.tsx          Auto-rotating hero carousel
├── horizontal-carousel.tsx  Accessible horizontal scroll + arrows
├── section-header.tsx       Section title + "See all" link
├── category-grid.tsx        Popular categories (icon grid)
├── promo-banner.tsx         Mid-page promotional CTA
├── delivery-badge.tsx       ETA pill
└── offer-badge.tsx          Discount / offer labels

features/
├── home/home-page-content.tsx   Composed homepage sections
├── products/product-card.tsx    V2 product card + add-to-cart
├── stores/store-card.tsx        V2 store card (default | compact | featured)
├── stores/store-detail-view.tsx Store hero + category menu
├── search/search-page-content.tsx
├── cart/cart-page-content.tsx
├── checkout/checkout-page-content.tsx
└── orders/orders-page-content.tsx

design-system/
├── tokens.ts                JebDekho brand tokens
└── primitives/              Shared S2 components (orange accent)
```

## Homepage wireframe

```
┌─────────────────────────────────────────┐
│ Jebdekho          Home Stores Search …  │  ← SiteHeader
├─────────────────────────────────────────┤
│ 📍 Delivering to ······    [Change]     │  ← LocationBanner
│ 🔍 Search for groceries…                │  ← Quick search CTA
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  HERO BANNER (auto carousel)      │ │  ← HeroBanner
│ │  Groceries in minutes · Shop now  │ │
│ └─────────────────────────────────────┘ │
│              ● ○ ○                      │
├─────────────────────────────────────────┤
│ Popular categories          See all →   │
│ [🥬][🥛][☕][🍪][🌾][🧴]…              │  ← CategoryGrid
├─────────────────────────────────────────┤
│ Nearby stores               See all →   │
│ ← [Store][Store][Store] →               │  ← HorizontalCarousel
├─────────────────────────────────────────┤
│ Best deals                  See all →   │
│ ← [Product][Product][Product] →         │  ← Discount products
├─────────────────────────────────────────┤
│ ┌ Limited offer ────────────────────┐ │
│ │ Free delivery on first order      │ │  ← PromoBanner
│ └───────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Top rated stores                        │
│ [Featured store cards × 3 grid]         │
├─────────────────────────────────────────┤
│ Recommended for you         See all →   │
│ ← [Product carousel] →                  │
├─────────────────────────────────────────┤
│ Recently viewed (if local data)         │
│ ← [Product carousel] →                  │
├─────────────────────────────────────────┤
│ Home | Stores | Search | Cart | Orders  │  ← MobileBottomNav
└─────────────────────────────────────────┘
```

## UX decisions

1. **Category-first IA (BigBasket-style)** — Homepage and store discovery lead with categories, then stores, then products. Search supports category filters and a dedicated deals mode (`?deals=1`).

2. **Speed-first patterns (Zepto / Blinkit)** — Sticky location bar, one-tap search entry, compact product cards with inline add-to-cart, delivery ETA badges on every store card.

3. **Unified shell** — Discovery and transactional flows share `PageShell` so cart count, orders, and navigation are always one tap away.

4. **Mobile-first** — Bottom tab bar (5 items), horizontal carousels with snap scrolling, 2-column product grids on small screens.

5. **WCAG AA** — Focus rings on all interactive elements (`:focus-visible`), `aria-label` on carousels/search, `role="tablist"` on filters, semantic headings per section, sufficient contrast (orange on cream / white).

6. **No external UI kits** — Built with existing Next.js 15, Tailwind, TypeScript, and in-repo primitives only.

7. **Functionality preserved** — All API hooks, BFF routes, auth guards, cart conflict handling, checkout (COD + Razorpay), and order flows unchanged.

8. **Recently viewed** — Client-side `localStorage` via `useRecentlyViewed` hook; no backend dependency.

9. **Add-to-cart wired** — `ProductCard` now includes `AddToCartButton` with store conflict modal support.

## Product card (V2)

- Product image (with placeholder)
- Weight / unit
- Store name (when cross-store search)
- Discount % badge
- Savings amount
- MRP strikethrough
- Veg indicator
- Compact add-to-cart control

## Store card (V2)

Variants: `default` (grid), `compact` (carousel), `featured` (top-rated).

- Rating + review count
- Distance
- ETA delivery badge
- Open / closed status
- Minimum order amount
- Delivery fee

## Files modified

### Design system & global styles
- `apps/buyer-web/design-system/tokens.ts`
- `apps/buyer-web/app/globals.css`
- `apps/buyer-web/tailwind.config.ts`
- `apps/buyer-web/design-system/primitives/button.tsx`
- `apps/buyer-web/design-system/primitives/button-link.tsx`
- `apps/buyer-web/design-system/primitives/badge.tsx`
- `apps/buyer-web/design-system/primitives/input.tsx`
- `apps/buyer-web/design-system/primitives/spinner.tsx`
- `apps/buyer-web/design-system/primitives/toast.tsx`
- `apps/buyer-web/components/ui/badge.tsx`

### New files
- `apps/buyer-web/components/v2/hero-banner.tsx`
- `apps/buyer-web/components/v2/horizontal-carousel.tsx`
- `apps/buyer-web/components/v2/section-header.tsx`
- `apps/buyer-web/components/v2/category-grid.tsx`
- `apps/buyer-web/components/v2/promo-banner.tsx`
- `apps/buyer-web/components/v2/delivery-badge.tsx`
- `apps/buyer-web/components/v2/offer-badge.tsx`
- `apps/buyer-web/features/home/home-page-content.tsx`
- `apps/buyer-web/hooks/use-recently-viewed.ts`
- `apps/buyer-web/BUYER_WEB_V2_UI_UPGRADE.md`

### Layout & shell
- `apps/buyer-web/components/layout/site-shell.tsx`

### Pages & features
- `apps/buyer-web/app/page.tsx`
- `apps/buyer-web/app/stores/page.tsx`
- `apps/buyer-web/features/stores/store-detail-view.tsx`
- `apps/buyer-web/features/stores/store-card.tsx`
- `apps/buyer-web/features/stores/location-banner.tsx`
- `apps/buyer-web/features/products/product-card.tsx`
- `apps/buyer-web/features/search/search-page-content.tsx`
- `apps/buyer-web/features/search/search-input.tsx`
- `apps/buyer-web/features/cart/cart-page-content.tsx`
- `apps/buyer-web/features/cart/components/add-to-cart-button.tsx`
- `apps/buyer-web/features/checkout/checkout-page-content.tsx`
- `apps/buyer-web/features/checkout/components/address-form.tsx`
- `apps/buyer-web/features/checkout/components/payment-method-selector.tsx`
- `apps/buyer-web/features/orders/orders-page-content.tsx`
- `apps/buyer-web/features/orders/order-detail-content.tsx`
- `apps/buyer-web/features/orders/components/order-card.tsx`
- `apps/buyer-web/features/orders/components/order-timeline.tsx`
- `apps/buyer-web/app/(s2)/orders/[id]/confirmation/page.tsx`

## Build verification

```bash
pnpm --filter @jebdekho/buyer-web run build
```

Expected: **0 TypeScript / ESLint errors**, successful static generation of all routes.
