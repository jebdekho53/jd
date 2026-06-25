# PHASE 10A — JebDekho Buyer Web Premium UI Redesign Plan

**Role:** Lead Product Designer + Senior Frontend Architect  
**Scope:** Complete production-ready redesign plan (BigBasket UX patterns analyzed for IA/conversion — **not** visual copying)  
**Status:** Planning document — supersedes orange-accent V2 spec with teal premium identity  
**Stack:** Next.js 15 · TypeScript · Tailwind · TanStack Query · Zustand · Custom design system · No shadcn

---

## Table of contents

1. [Complete UX audit](#1-complete-ux-audit-of-current-buyer-web)
2. [Problems found](#2-problems-found)
3. [New information architecture](#3-new-information-architecture)
4. [Complete homepage wireframe](#4-complete-homepage-wireframe)
5. [Complete mobile wireframe](#5-complete-mobile-wireframe)
6. [Component hierarchy](#6-component-hierarchy)
7. [Folder structure updates](#7-folder-structure-updates)
8. [New components list](#8-new-components-list)
9. [Design token recommendations](#9-design-token-recommendations)
10. [Performance improvements](#10-performance-improvements)
11. [Exact Next.js implementation plan](#11-exact-nextjs-implementation-plan)
12. [Priority order for implementation](#12-priority-order-for-implementation)

---

## 1. Complete UX audit of current buyer-web

### 1.1 What exists today (post-V2)

| Area | Current state | Maturity |
|------|---------------|----------|
| **Homepage** | 10 sections: location bar, search CTA, hero carousel, categories, nearby stores, best deals, promos, top-rated, recommendations, recently viewed | **MVP** — static promos, weak personalization |
| **Navigation** | Unified `PageShell`: 5-tab bottom nav + desktop header, cart badge | **Good** — missing floating cart, categories tab |
| **Store discovery** | Distance-sorted grid, client text filter, category redirect | **Basic** — no sort/filter drawer |
| **Store detail** | Hero, ratings, category pills, product grid, load more | **Basic** — no in-store search/sort |
| **Search** | Debounced FTS, category filter, deals mode (`?deals=1`) | **Basic** — no autocomplete, voice, history |
| **Product cards** | Image, weight, price, MRP, discount badge, savings, add-to-cart | **Good** — no compare, wishlist, qty on card |
| **Cart** | Single-store cart, summary, conflict modal, min-order gate | **Functional** — no coupons, cross-sell, ETA |
| **Checkout** | Address → payment (COD/Razorpay), order note | **Functional** |
| **Orders** | List, filters, detail, timeline, confirmation | **Functional** |
| **Design system** | `tokens.ts`, primitives, `components/v2/*`, cream + **orange** accent | **Needs rebrand** to teal `#0f766e` |
| **Accessibility** | Focus rings, aria on carousels/filters, semantic headings | **Partial AA** — gaps in modals/drawers |
| **Footer** | None | **Missing** |
| **Product detail page** | None (`/products/[slug]` does not exist) | **Missing** |

### 1.2 BigBasket-inspired patterns adopted (UX only, not visual)

| Pattern | BigBasket intent | JebDekho adaptation |
|---------|------------------|---------------------|
| Sticky location + search | Reduce friction before browse | Sticky delivery bar + expandable smart search overlay |
| Category horizontal scroll | Fast aisle navigation | `CategoryRail` with cream pills + teal active state |
| Deal strips | Urgency + savings visibility | **Flash Deals** with countdown + **Price Compare Zone** (USP) |
| Repeat / personalized rails | Retention | Recently viewed + reorder from orders + FBT |
| Store/vendor trust | Local merchant confidence | **Best Local Vendors** spotlight with badges |
| Savings callouts everywhere | Conversion psychology | Savings summary in cart, price-drop indicators on cards |
| Minimal footer | Clean exit, SEO links | Compact 4-column footer, no text walls |

### 1.3 API & data layer audit

| Capability | Prisma | API endpoint | Buyer-web UI |
|------------|--------|--------------|--------------|
| Store discovery | ✅ | `GET /buyer/stores` | ✅ |
| Store products | ✅ | `GET /buyer/stores/:slug/products` | ✅ |
| Product search (cross-store) | ✅ | `GET /buyer/products/search` | ✅ |
| Categories | ✅ | `GET /buyer/categories` | ✅ |
| Cart / checkout / orders | ✅ | BFF `/api/buyer/*` | ✅ |
| **Price comparison** | ✅ (implicit via search) | Partial — same product across stores not grouped | ❌ |
| **Flash deals** | ❌ no `Promotion` model | ❌ | ❌ (client MRP filter only) |
| **Trending** | ❌ | ❌ | ❌ |
| **Brands** | ✅ `Product.brand` | Search ranks brand | ❌ no brand rail |
| **Coupons** | ✅ `Coupon`, `CouponUsage` | ❌ no buyer coupon API | ❌ |
| **Wishlist** | ✅ `WishlistItem` | ❌ no wishlist API | ❌ |
| **FBT / recommendations** | ❌ | ❌ | ❌ |
| **Voice search** | N/A | N/A | ❌ |
| **Saved addresses** | ✅ (profile) | Partial via checkout | ❌ on home location bar |

### 1.4 Conversion funnel gaps

```
Awareness → Discovery → Consideration → Cart → Checkout → Retention
    ✅           ⚠️            ❌           ⚠️        ✅          ❌
```

- **Consideration weak:** No PDP, no price compare, no wishlist → users cannot evaluate before committing to a store
- **Cart weak:** No coupon, cross-sell, or floating cart → abandoned carts likely
- **Retention weak:** No reorder rail, no personalized deals, no push for saved addresses

---

## 2. Problems found

### P0 — Blocks premium positioning

| # | Problem | Impact |
|---|---------|--------|
| 1 | **No price comparison UI** despite hyperlocal multi-vendor USP | Core differentiation invisible |
| 2 | **Orange accent conflicts with Phase 10A teal spec** | Brand inconsistency |
| 3 | **Location picker disabled on discovery pages** | Users cannot change delivery area |
| 4 | **Two unsynced location stores** (`ui-store` vs `location-store`) | Wrong store results / address bugs |
| 5 | **No product detail page** | Dead-end from search; no SEO for SKUs |

### P1 — Conversion killers

| # | Problem | Impact |
|---|---------|--------|
| 6 | No smart search (suggestions, history, trending) | High search abandonment |
| 7 | No flash deal urgency (countdown, limited stock) | Weak deal perception |
| 8 | No floating cart / mini-cart drawer (`drawerOpen` unused) | Extra taps to checkout |
| 9 | No coupon apply in cart | Revenue + conversion loss |
| 10 | No cross-sell / FBT in cart | Lower AOV |
| 11 | Store page lacks in-store search, sort, filter drawer | Poor menu UX at scale |

### P2 — Retention & polish

| # | Problem | Impact |
|---|---------|--------|
| 12 | No wishlist | No save-for-later loop |
| 13 | No brand slider / shop-by-brand | Weak brand discovery |
| 14 | No site footer | Unprofessional, poor SEO |
| 15 | Recommendations are category-first, not behavioral | Low relevance |
| 16 | Recently viewed shows placeholder images | Broken trust signal |
| 17 | No voice search entry | Mobile friction |
| 18 | Hero banners are static, not CMS-driven | Merchandising rigidity |

### P3 — Technical debt

| # | Problem | Impact |
|---|---------|--------|
| 19 | Dual design systems (`components/ui` + `design-system/primitives`) | Inconsistent styling |
| 20 | Dual QueryClient (root + S2 layout) | Cache fragmentation |
| 21 | No virtualized grids for long product lists | Scroll jank on low-end phones |
| 22 | shadcn-style `components/ui` still present despite "no shadcn" rule | Dependency confusion |

---

## 3. New information architecture

### 3.1 Sitemap (target)

```
/                                    Home (15-section discovery hub)
├── /search                          Smart search hub
│   └── ?q=&categoryId=&deals=1&sort=
├── /compare                         Price comparison results
│   └── ?q=product-name
├── /categories
│   └── /categories/[slug]           Category landing (grid + filters)
├── /brands
│   └── /brands/[slug]               Brand shop
├── /stores                          Store discovery (map + list)
│   └── /stores/[slug]               Store menu (search, sort, filter)
├── /products/[slug]                 Product detail (NEW)
│   └── ?store=slug                  Store-specific offer context
├── /deals                           Flash deals landing
├── /cart                            Premium cart
├── /checkout                        Checkout
├── /orders                          Order history + reorder
│   ├── /orders/[id]
│   └── /orders/[id]/confirmation
├── /wishlist                        Saved products (auth)
├── /login
├── /onboarding
└── /account                         Profile, addresses, preferences (future)
```

### 3.2 Navigation model

**Mobile bottom nav (5 tabs):**
`Home` · `Categories` · `Search` · `Stores` · `Cart` (badge)

Orders & account move to header avatar menu (reduces tab clutter).

**Persistent chrome:**
- Sticky location bar (collapses on scroll down, expands on scroll up)
- Floating cart pill when `cart.itemCount > 0` and not on `/cart`

### 3.3 Content hierarchy principles

1. **Location → Search → Savings** always visible within first viewport
2. **Compare prices** appears above generic product rails (USP first)
3. **Store trust** (rating, ETA, open status) before product grids
4. **Urgency** (flash deals) after trust, before evergreen catalog
5. **Personalization** (recent, FBT, recommended) in lower half
6. **Footer** minimal — 4 link groups max

### 3.4 User mental model

```
"Where am I shopping?" → Location bar
"What do I want?"      → Search / Categories
"Who has it cheapest?" → Compare zone (JebDekho unique)
"Who delivers fastest?"→ Nearby stores
"Any deals right now?" → Flash deals
"Buy again?"           → Reorder / Recent / FBT
```

---

## 4. Complete homepage wireframe

**Viewport:** Desktop 1280px (mobile variant in §5)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STICKY HEADER                                                            │
│ [Jebdekho]              [Categories▾] [Stores] [Orders▾] [👤] [Cart (2)] │
├──────────────────────────────────────────────────────────────────────────┤
│ STICKY LOCATION BAR (#cream-2, border-bottom)                            │
│ [📍] Deliver to: Connaught Place, Delhi    [Saved ▾] [GPS] [Change]      │
├──────────────────────────────────────────────────────────────────────────┤
│ SMART SEARCH BAR (#card, rounded-2xl, shadow-sm)                         │
│ [🔍 Search products, brands, stores…]  [🎤]                              │
│ ── overlay on focus ──                                                   │
│ Recent: atta · milk · bananas                                          │
│ Trending: #diwali #organic #cold drinks                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ HERO CAROUSEL (full-bleed rounded-3xl, teal gradient accents)            │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │  "Compare prices. Save more."     [Shop deals]  [Compare now]      │   │
│ │  ○ ● ○   swipe / auto-rotate 5s                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────────┤
│ CATEGORY EXPLORER (horizontal snap scroll)                               │
│ [Grocery][Fruits][Vegetables][Dairy][Snacks][Beverages][Household]…     │
├──────────────────────────────────────────────────────────────────────────┤
│ ★ JEBDEKHO PRICE COMPARISON ZONE (#cream-3 panel, teal header rule)     │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Amul Taaza Milk 500ml                                               ││
│ │ Store A  ₹24  │ Store B  ₹22 ★ BEST │ Store C  ₹26                  ││
│ │ Save 8% vs highest · [Compare all stores →]                         ││
│ └─────────────────────────────────────────────────────────────────────┘│
│ (repeat 3–5 compare cards in horizontal carousel)                        │
├──────────────────────────────────────────────────────────────────────────┤
│ NEARBY STORES                                    [See all stores →]      │
│ ← [Store card: rating, distance, ETA, open, min order, 120 items] →     │
├──────────────────────────────────────────────────────────────────────────┤
│ ⚡ FLASH DEALS                          ends in 02:14:33                 │
│ ← [Product + % off + "Only 5 left" + quick add] →                       │
├──────────────────────────────────────────────────────────────────────────┤
│ TRENDING NOW (2-col mobile / 4-col desktop grid)                         │
│ [ProductCard + wishlist ♡ + price drop ↓ + quick add]                   │
├──────────────────────────────────────────────────────────────────────────┤
│ RECENTLY VIEWED (personalized, hidden if empty)                          │
├──────────────────────────────────────────────────────────────────────────┤
│ FREQUENTLY BOUGHT TOGETHER (bundle card: 3 products + combo savings)    │
├──────────────────────────────────────────────────────────────────────────┤
│ SEASONAL PROMOTIONS (2-up banner grid)                                   │
│ [Festive essentials] [Monsoon pantry]                                    │
├──────────────────────────────────────────────────────────────────────────┤
│ POPULAR BRANDS (logo slider)                                             │
│ ← [Amul][Britannia][Tata][MDH]… →                                       │
├──────────────────────────────────────────────────────────────────────────┤
│ BEST LOCAL VENDORS (vendor spotlight cards + trust badges)               │
│ "Verified merchant · 4.8★ · 2.1km · Free delivery over ₹199"            │
├──────────────────────────────────────────────────────────────────────────┤
│ RECOMMENDED FOR YOU                                                      │
│ ← product carousel →                                                     │
├──────────────────────────────────────────────────────────────────────────┤
│ FOOTER (minimal, #cream-4)                                               │
│ Shop · Help · Company · Legal    © 2026 JebDekho                        │
└──────────────────────────────────────────────────────────────────────────┘

FLOATING (mobile + desktop):
┌─────────────────────────┐
│ 🛒 2 items · ₹148  View │  ← bottom sticky above nav when cart non-empty
└─────────────────────────┘
```

---

## 5. Complete mobile wireframe

**Viewport:** 390×844 (iPhone 14 class)

```
┌─────────────────────────────┐
│ Jebdekho            🛒(2) 👤│  ← compact header (56px)
├─────────────────────────────┤
│ 📍 Deliver to               │  ← sticky location (48px)
│ Connaught Place      Change │
├─────────────────────────────┤
│ 🔍 Search…            🎤   │  ← tap → full-screen search sheet
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   HERO (16:9)           │ │  ← swipeable, dots below
│ │   Compare & save        │ │
│ └─────────────────────────┘ │
│        ● ○ ○                │
├─────────────────────────────┤
│ Categories →→→→→→→→→→→→   │  ← 72px icons, 4 visible
├─────────────────────────────┤
│ Compare prices         See all│
│ ┌─────────────────────────┐ │
│ │ Milk 500ml              │ │
│ │ A ₹24 B ₹22★ C ₹26      │ │
│ │ [Compare]               │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Nearby stores          See all│
│ ← [store compact card] →    │
├─────────────────────────────┤
│ ⚡ Flash deals  ⏱ 02:14:33  │
│ ← [deal card] →             │
├─────────────────────────────┤
│ Trending                    │
│ ┌──────┐ ┌──────┐          │  ← 2-col grid
│ │ prod │ │ prod │          │
│ └──────┘ └──────┘          │
│ ┌──────┐ ┌──────┐          │
│ │ prod │ │ prod │          │
│ └──────┘ └──────┘          │
├─────────────────────────────┤
│ Recently viewed →→          │
│ FBT bundle card             │
│ Seasonal banners (stacked)  │
│ Brands →→→                  │
│ Local vendors (stacked)     │
│ Recommended →→              │
├─────────────────────────────┤
│ Footer (accordion links)    │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │  ← floating cart (56px)
│ │ View cart · 2 · ₹148    │ │
│ └─────────────────────────┘ │
│ [Home][Cat][🔍][Stores][Cart]│  ← bottom nav (64px + safe area)
└─────────────────────────────┘

GESTURES:
- Hero: horizontal swipe
- Carousels: snap scroll + momentum
- Product card: long-press → quick view sheet (phase 2)
- Pull-to-refresh on home (revalidate queries)

THUMB ZONES:
- Primary CTAs: bottom 40% of screen
- Compare + Add: min 44×44px touch targets
- Bottom nav + floating cart: no overlap (cart sits 8px above nav)
```

### 5.1 Mobile search sheet (full-screen overlay)

```
┌─────────────────────────────┐
│ ← [Search input──────] 🎤  │
├─────────────────────────────┤
│ Recent searches             │
│ atta · milk · bananas  [×]  │
├─────────────────────────────┤
│ Trending                    │
│ #organic #snacks #diwali    │
├─────────────────────────────┤
│ Popular categories          │
│ [grid 4×2]                  │
├─────────────────────────────┤
│ Live results (after 2 chars)│
│ [ProductCard compact…]      │
└─────────────────────────────┘
```

---

## 6. Component hierarchy

```
AppRoot
├── Providers
│   ├── QueryProvider (single instance)
│   ├── AuthProvider
│   └── ToastProvider
│
├── AppShell
│   ├── SiteHeader
│   ├── StickyLocationBar          ★ NEW
│   ├── <main>
│   └── MobileBottomNav
│   ├── FloatingCartBar            ★ NEW
│   └── MiniCartDrawer             ★ NEW
│
├── layout/
│   ├── app-shell.tsx
│   ├── site-header.tsx
│   ├── sticky-location-bar.tsx
│   ├── mobile-bottom-nav.tsx
│   ├── floating-cart-bar.tsx
│   ├── mini-cart-drawer.tsx
│   └── site-footer.tsx            ★ NEW
│
├── merchandising/                 ★ NEW namespace
│   ├── hero-carousel.tsx
│   ├── category-rail.tsx
│   ├── price-compare-card.tsx     ★ USP
│   ├── price-compare-zone.tsx
│   ├── flash-deal-card.tsx
│   ├── flash-deals-section.tsx
│   ├── countdown-timer.tsx
│   ├── brand-slider.tsx
│   ├── vendor-spotlight-card.tsx
│   ├── seasonal-banner-grid.tsx
│   ├── fbt-bundle-card.tsx
│   └── promo-strip.tsx
│
├── discovery/
│   ├── smart-search-bar.tsx
│   ├── search-overlay.tsx
│   ├── search-suggestions.tsx
│   ├── voice-search-button.tsx
│   ├── recent-searches.tsx
│   ├── trending-chips.tsx
│   ├── section-header.tsx
│   └── horizontal-carousel.tsx
│
├── catalog/
│   ├── product-card/
│   │   ├── product-card.tsx
│   │   ├── product-card-compact.tsx
│   │   ├── product-card-compare.tsx
│   │   └── product-quantity-stepper.tsx
│   ├── product-grid.tsx
│   ├── virtualized-product-grid.tsx
│   └── price-drop-badge.tsx
│
├── store/
│   ├── store-card/
│   │   ├── store-card-default.tsx
│   │   ├── store-card-compact.tsx
│   │   └── store-card-featured.tsx
│   ├── store-hero.tsx
│   ├── store-filter-drawer.tsx
│   ├── store-sort-select.tsx
│   └── in-store-search.tsx
│
├── cart/
│   ├── cart-savings-banner.tsx
│   ├── cart-coupon-input.tsx
│   ├── cart-cross-sell.tsx
│   ├── cart-vendor-summary.tsx
│   └── cod-badge.tsx
│
├── compare/                       ★ NEW feature
│   ├── compare-page.tsx
│   ├── compare-table.tsx
│   └── compare-store-row.tsx
│
└── design-system/
    ├── tokens.ts
    └── primitives/ (Button, Input, Badge, Card, Modal, Drawer, Sheet…)
```

---

## 7. Folder structure updates

```
apps/buyer-web/
├── app/
│   ├── layout.tsx                    # Single QueryProvider + AppShell wrapper
│   ├── page.tsx                      # Home
│   ├── search/page.tsx
│   ├── compare/page.tsx              ★ NEW
│   ├── deals/page.tsx                ★ NEW
│   ├── categories/
│   │   ├── page.tsx                  ★ NEW
│   │   └── [slug]/page.tsx           ★ NEW
│   ├── brands/
│   │   ├── page.tsx                  ★ NEW
│   │   └── [slug]/page.tsx           ★ NEW
│   ├── products/[slug]/page.tsx      ★ NEW
│   ├── stores/…
│   ├── wishlist/page.tsx             ★ NEW
│   └── (s2)/…                        # Keep auth group; merge providers up
│
├── components/
│   ├── layout/                       # Shell chrome
│   ├── discovery/                    ★ NEW (search, carousels)
│   ├── merchandising/                ★ NEW (home sections)
│   ├── catalog/                      ★ NEW (product cards, grids)
│   └── common/                       # Empty, error, skeletons
│
├── features/
│   ├── home/                         # Orchestrates home sections
│   ├── compare/                      ★ NEW
│   ├── deals/                        ★ NEW
│   ├── brands/                       ★ NEW
│   ├── wishlist/                     ★ NEW
│   ├── products/                     # PDP + cards
│   ├── stores/
│   ├── search/
│   ├── cart/
│   ├── checkout/
│   └── orders/
│
├── hooks/
│   ├── use-buyer-queries.ts
│   ├── use-compare-products.ts       ★ NEW
│   ├── use-flash-deals.ts            ★ NEW
│   ├── use-brands.ts                 ★ NEW
│   ├── use-wishlist.ts               ★ NEW
│   ├── use-search-history.ts         ★ NEW
│   ├── use-voice-search.ts           ★ NEW
│   └── use-recently-viewed.ts
│
├── services/
│   ├── buyer/buyer-api.ts            # Extend with new endpoints
│   ├── compare/compare-api.ts        ★ NEW
│   ├── wishlist/wishlist-api.ts      ★ NEW
│   └── coupons/coupon-api.ts         ★ NEW
│
├── store/
│   ├── location-store.ts             # ★ UNIFY — deprecate ui-store location
│   ├── search-store.ts               ★ NEW (overlay open, history)
│   └── cart-store.ts                 # Wire drawerOpen
│
└── design-system/
    ├── tokens.ts                     # Teal rebrand
    └── primitives/
```

**Deprecate / merge:**
- `components/v2/*` → move into `discovery/` + `merchandising/`
- `components/ui/*` → migrate to `design-system/primitives/` (remove shadcn CVA layer)
- `store/ui-store.ts` location slice → merge into `location-store.ts`

---

## 8. New components list

### 8.1 Layout & chrome (8)

| Component | Purpose |
|-----------|---------|
| `StickyLocationBar` | Deliver-to + saved addresses + GPS + change |
| `SiteFooter` | Minimal SEO footer |
| `FloatingCartBar` | Sticky cart CTA with total |
| `MiniCartDrawer` | Bottom sheet quick cart view |
| `SearchOverlay` | Full-screen mobile search |
| `AccountMenu` | Orders, wishlist, login |
| `SavedAddressPicker` | Dropdown in location bar |
| `ScrollCollapseHeader` | Hide/show location on scroll |

### 8.2 Merchandising / home (14)

| Component | Purpose |
|-----------|---------|
| `HeroCarousel` | Auto-rotate, swipe, CTA — CMS-ready props |
| `CategoryRail` | Horizontal category explorer |
| `PriceCompareZone` | USP section wrapper |
| `PriceCompareCard` | Product + multi-vendor prices + best deal |
| `FlashDealsSection` | Timed deals rail |
| `FlashDealCard` | Product + countdown + stock urgency |
| `CountdownTimer` | Accessible live region timer |
| `TrendingProductGrid` | Grid with quick add |
| `FBTBundleCard` | "Frequently bought together" bundle |
| `SeasonalBannerGrid` | 2-up promotional banners |
| `BrandSlider` | Logo carousel |
| `VendorSpotlightCard` | Best local vendor feature |
| `TrustBadgeStrip` | Verified, COD, fast delivery |
| `ReorderRail` | From order history |

### 8.3 Catalog (10)

| Component | Purpose |
|-----------|---------|
| `ProductCard` (premium) | Full card per spec |
| `ProductCardCompact` | Carousel / search results |
| `ProductCardCompare` | Row in compare table |
| `ProductQuantityStepper` | +/- on card |
| `ComparePricesButton` | Opens compare flow |
| `WishlistButton` | Heart toggle |
| `PriceDropBadge` | ↓ price indicator |
| `VegBadge` | Veg / non-veg |
| `VirtualizedProductGrid` | Performance grid |
| `ProductDetailPage` | Full PDP layout |

### 8.4 Store (6)

| Component | Purpose |
|-----------|---------|
| `StoreHero` | Banner + meta + badges |
| `StoreFilterDrawer` | Open now, free delivery, veg |
| `StoreSortSelect` | Distance, rating, ETA, min order |
| `InStoreSearch` | Search within store menu |
| `StoreCategoryTabs` | Sticky category tabs |
| `StoreHoursBadge` | Today's hours |

### 8.5 Search (7)

| Component | Purpose |
|-----------|---------|
| `SmartSearchBar` | Input + mic + overlay trigger |
| `VoiceSearchButton` | Web Speech API |
| `SearchSuggestions` | Live autocomplete |
| `RecentSearches` | localStorage + clear |
| `TrendingSearches` | Static/config or API |
| `SearchEmptyState` | No results + suggestions |
| `PopularCategoriesGrid` | In search overlay |

### 8.6 Cart (6)

| Component | Purpose |
|-----------|---------|
| `CartSavingsBanner` | Total saved callout |
| `CartCouponInput` | Apply coupon code |
| `CartCrossSell` | Recommended add-ons |
| `CartVendorSummary` | Store info + ETA |
| `CodBadge` | COD available indicator |
| `EstimatedArrival` | Delivery window |

**Total new/major components: ~51**

---

## 9. Design token recommendations

### 9.1 Color system (Phase 10A authoritative)

```css
:root {
  /* Surfaces */
  --cream-1: #f1eedf;
  --cream-2: #f2efe0;
  --cream-3: #f4f1e2;
  --cream-4: #f0edde;
  --cream-5: #eeebda;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #6b7280;

  /* Semantic */
  --success: #16a34a;
  --warning: #f59e0b;
  --danger: #dc2626;

  /* Brand accent — trust + premium (NOT BigBasket green) */
  --accent: #0f766e;
  --accent-hover: #0d6b63;
  --accent-muted: #ccfbf1;
  --accent-foreground: #ffffff;

  /* Mapped Tailwind tokens */
  --background: var(--cream-1);
  --foreground: var(--text-primary);
  --card: #ffffff;
  --primary: var(--accent);
  --primary-foreground: var(--accent-foreground);
  --muted: var(--cream-3);
  --muted-foreground: var(--text-secondary);
  --border: #e5e0d0;
  --ring: var(--accent);
  --radius: 0.875rem;
}
```

### 9.2 Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display` | 30px / 1.2 | 700 | Hero headlines |
| `h1` | 24px | 700 | Page titles |
| `h2` | 20px | 600 | Section headers |
| `h3` | 17px | 600 | Card titles |
| `body` | 15px | 400 | Default |
| `body-sm` | 13px | 400 | Secondary |
| `caption` | 11px | 500 | Meta, badges |
| `price` | 16px | 700 | Product prices |
| `price-sm` | 14px | 600 | Compare rows |

**Font:** Keep Inter for Phase 10A (already loaded). Phase 10B may introduce a custom display font for wordmark only.

### 9.3 Spacing (4px grid)

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight inline |
| `space-2` | 8px | Icon gaps |
| `space-3` | 12px | Card padding mobile |
| `space-4` | 16px | Section gaps mobile |
| `space-6` | 24px | Section gaps desktop |
| `space-8` | 32px | Major section breaks |
| `touch` | 44px | Minimum tap target |

### 9.4 Elevation

| Level | Shadow | Use |
|-------|--------|-----|
| `elevation-0` | none | Flat sections on cream |
| `elevation-1` | `0 1px 3px rgba(17,24,39,0.06)` | Cards |
| `elevation-2` | `0 4px 12px rgba(17,24,39,0.08)` | Floating cart, drawers |
| `elevation-3` | `0 8px 24px rgba(17,24,39,0.12)` | Modals |

### 9.5 Motion

| Token | Duration | Easing |
|-------|----------|--------|
| `fast` | 150ms | ease-out |
| `normal` | 250ms | ease-in-out |
| `slow` | 400ms | ease-in-out |
| `carousel` | 5000ms | linear (auto-rotate) |

Respect `prefers-reduced-motion`: disable carousel auto-rotate and countdown animations.

---

## 10. Performance improvements

### 10.1 Rendering

| Technique | Where | Implementation |
|-----------|-------|----------------|
| **Image lazy loading** | All product/store images | `next/image` + `loading="lazy"` + `sizes` per breakpoint |
| **Virtualized grids** | Search results, store menu (>40 items) | `@tanstack/react-virtual` in `VirtualizedProductGrid` |
| **Infinite scroll** | Search, store products | `useInfiniteQuery` replacing manual page state |
| **Skeleton loading** | Every async section | Per-section skeleton matching layout (avoid layout shift) |
| **Route prefetching** | Category, store cards | `Link prefetch` on viewport intersection |
| **Code splitting** | Search overlay, compare, voice | `dynamic(() => import(...), { ssr: false })` |

### 10.2 Data layer

| Technique | Implementation |
|-----------|----------------|
| **Query caching** | `staleTime: 60_000` for categories/brands; `30_000` for stores |
| **Prefetch on home** | `queryClient.prefetchQuery` for categories + nearby stores in `layout` |
| **Optimistic cart** | `onMutate` in `useAddCartItemMutation` (already partial — extend to stepper) |
| **Deduped search** | `placeholderData: keepPreviousData` (already used) |
| **Single QueryClient** | Remove duplicate from `(s2)/layout.tsx` |
| **Parallel home sections** | Each section owns its query — no blocking waterfall |

### 10.3 Bundle

| Action | Impact |
|--------|--------|
| Remove `components/ui` shadcn layer | ~15KB gzip |
| Tree-shake Lucide icons | Import per-icon paths |
| Lazy load Web Speech API module | Only when mic tapped |

### 10.4 Core Web Vitals targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s on 4G |
| INP | < 200ms |
| CLS | < 0.1 (reserve image aspect ratios) |

---

## 11. Exact Next.js implementation plan

### Phase 10A.1 — Foundation (Week 1)

**Goal:** Teal rebrand + unified shell + location fix

| Task | Files |
|------|-------|
| Update tokens to teal spec | `globals.css`, `tokens.ts`, `tailwind.config.ts` |
| Migrate all `brand-500` / orange refs → `accent` | primitives, v2, features |
| Unify `location-store` (deprecate `ui-store` location) | `store/location-store.ts`, all consumers |
| Wire `LocationPickerModal` to `StickyLocationBar` | `sticky-location-bar.tsx` |
| Add `SiteFooter` | `components/layout/site-footer.tsx` |
| Merge QueryClient to root | `app/layout.tsx`, remove from s2 |
| Add `FloatingCartBar` + wire `cart-store.drawerOpen` | `floating-cart-bar.tsx`, `mini-cart-drawer.tsx` |

```tsx
// app/layout.tsx (target)
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
```

### Phase 10A.2 — Smart search (Week 2)

| Task | Files |
|------|-------|
| `SmartSearchBar` + `SearchOverlay` | `components/discovery/*` |
| `useSearchHistory` (localStorage) | `hooks/use-search-history.ts` |
| `TrendingSearches` (config-driven initially) | `config/trending-searches.ts` |
| `VoiceSearchButton` (Web Speech API) | `hooks/use-voice-search.ts` |
| Upgrade `/search` page to use overlay pattern on mobile | `features/search/` |

### Phase 10A.3 — Price comparison USP (Week 2–3)

**Backend (API):**

```
GET /buyer/products/compare?q=amul+milk&lat=&lng=
→ {
    groups: [{
      canonicalName: "Amul Taaza Milk 500ml",
      unit: "500ml",
      offers: [
        { store, variantId, price, mrp, availableQty, eta }
      ],
      bestOfferIndex: 1,
      savingsPercent: 8
    }]
  }
```

Implementation: extend `buyer-product.service.ts` to group search results by normalized `name + unit`.

**Frontend:**

| Task | Files |
|------|-------|
| `compare-api.ts` + `useCompareProducts` | services + hooks |
| `PriceCompareCard` + `PriceCompareZone` | `components/merchandising/` |
| `/compare` page | `app/compare/page.tsx` |
| Add `ComparePricesButton` to `ProductCard` | `components/catalog/` |
| Home section #5 | `features/home/sections/price-compare-section.tsx` |

### Phase 10A.4 — Premium product & store (Week 3)

| Task | Files |
|------|-------|
| Premium `ProductCard` with wishlist, stepper, compare | `components/catalog/product-card/` |
| `ProductDetailPage` at `/products/[slug]` | `app/products/[slug]/page.tsx` |
| `StoreHero` + `InStoreSearch` + `StoreSortSelect` + `StoreFilterDrawer` | `features/stores/` |
| `VirtualizedProductGrid` for store menu | `components/catalog/` |

### Phase 10A.5 — Merchandising home sections (Week 3–4)

Build each home section as isolated server-safe client component:

```
features/home/
├── home-page-content.tsx          # orchestrator
└── sections/
    ├── location-section.tsx       # wraps StickyLocationBar
    ├── search-section.tsx
    ├── hero-section.tsx
    ├── category-section.tsx
    ├── price-compare-section.tsx
    ├── nearby-stores-section.tsx
    ├── flash-deals-section.tsx
    ├── trending-section.tsx
    ├── recently-viewed-section.tsx
    ├── fbt-section.tsx
    ├── seasonal-section.tsx
    ├── brands-section.tsx
    ├── vendors-section.tsx
    ├── recommended-section.tsx
    └── reorder-section.tsx
```

Each section:
- Owns its skeleton
- Fails gracefully (hidden if empty)
- Uses `SectionHeader` consistently

### Phase 10A.6 — Flash deals (Week 4)

**Backend:**

```prisma
model Promotion {
  id          String   @id @default(cuid())
  title       String
  productId   String
  variantId   String
  storeId     String
  discountPct Int
  stockLimit  Int?
  startsAt    DateTime
  endsAt      DateTime
  isActive    Boolean  @default(true)
  ...
}
```

```
GET /buyer/deals/flash?lat=&lng=
```

**Frontend:** `FlashDealCard` + `CountdownTimer` + `/deals` page

### Phase 10A.7 — Cart premium (Week 4–5)

**Backend:**

```
POST /buyer/cart/coupon/validate  { code }
POST /buyer/cart/coupon/apply     { code }
DELETE /buyer/cart/coupon
```

**Frontend:**

| Component | Wire to |
|-----------|---------|
| `CartCouponInput` | coupon API |
| `CartSavingsBanner` | cart.totals |
| `CartCrossSell` | store products query |
| `CartVendorSummary` | cart.store |
| `EstimatedArrival` | store.avgPrepTimeMins |

### Phase 10A.8 — Wishlist + brands (Week 5)

**Backend:**

```
GET/POST/DELETE /buyer/wishlist
GET /buyer/brands?limit=20
GET /buyer/brands/:slug/products
```

**Frontend:** `WishlistButton`, `/wishlist` page, `BrandSlider`, `/brands`

### Phase 10A.9 — FBT + recommendations (Week 5–6)

**V1 (no ML):** Rule-based — products frequently in same orders (SQL aggregation on `OrderItem`).

```
GET /buyer/recommendations/fbt?productId=
GET /buyer/recommendations/trending?lat=&lng=
GET /buyer/recommendations/for-you        # order history + recent
```

### Phase 10A.10 — Polish & QA (Week 6)

| Task | Detail |
|------|--------|
| Accessibility audit | axe-core CI, keyboard nav all drawers |
| Performance audit | Lighthouse mobile ≥ 90 |
| E2E smoke tests | Home → search → add → checkout |
| Remove deprecated `components/ui` | Full migration to primitives |
| Update `BUYER_WEB_V2_UI_UPGRADE.md` | Mark superseded by Phase 10A |

---

## 12. Priority order for implementation

### Sprint 1 — Foundation & conversion core (P0)

| # | Item | Effort | ROI |
|---|------|--------|-----|
| 1 | Teal design token migration | M | Brand trust |
| 2 | Unify location store + wire picker | S | Correct discovery |
| 3 | `StickyLocationBar` with saved addresses | M | BigBasket pattern |
| 4 | `FloatingCartBar` + mini-cart drawer | M | +checkout starts |
| 5 | `SiteFooter` | S | SEO + polish |
| 6 | Single QueryClient | S | Performance |

### Sprint 2 — USP & search (P0/P1)

| # | Item | Effort | ROI |
|---|------|--------|-----|
| 7 | **Price comparison API + UI** | L | **Core differentiator** |
| 8 | `PriceCompareZone` on home | M | USP visibility |
| 9 | Smart search overlay + history | M | Discovery |
| 10 | Trending searches (config) | S | Engagement |
| 11 | `/compare` page | M | SEO + sharing |

### Sprint 3 — Product & store depth (P1)

| # | Item | Effort | ROI |
|---|------|--------|-----|
| 12 | Premium `ProductCard` (stepper, wishlist, compare) | M | Cart additions |
| 13 | Product detail page | L | Consideration |
| 14 | Store page: in-store search, sort, filter | M | Store UX |
| 15 | `VirtualizedProductGrid` | M | Performance |

### Sprint 4 — Merchandising & urgency (P1)

| # | Item | Effort | ROI |
|---|------|--------|-----|
| 16 | Flash deals model + API | L | Urgency |
| 17 | `CountdownTimer` + flash section | M | Conversion |
| 18 | Trending products (API) | M | Discovery |
| 19 | Brand slider + `/brands` | M | Merchandising |
| 20 | Vendor spotlight section | S | Local trust |

### Sprint 5 — Cart & retention (P1/P2)

| # | Item | Effort | ROI |
|---|------|--------|-----|
| 21 | Coupon validate/apply API + UI | L | Revenue |
| 22 | Cart cross-sell / savings banner | M | AOV |
| 23 | Wishlist API + UI | M | Retention |
| 24 | FBT recommendations | L | AOV |
| 25 | Reorder rail from orders | M | Retention |

### Sprint 6 — Polish (P2/P3)

| # | Item | Effort | ROI |
|---|------|--------|-----|
| 26 | Voice search | S | Mobile UX |
| 27 | CMS-driven hero banners | M | Merchandising |
| 28 | Remove shadcn `components/ui` layer | M | Tech debt |
| 29 | Accessibility + Lighthouse audit | M | Compliance |
| 30 | Infinite scroll migration | M | Performance |

---

## Appendix A — Product card specification

```
┌─────────────────────────┐
│ [8% OFF]        [♡]     │
│ ┌─────────────────────┐ │
│ │     product img     │ │
│ │              [veg]  │ │
│ └─────────────────────┘ │
│ Amul Taaza Milk         │
│ 500ml · Fresh Mart      │
│ ₹22  ₹26  Save ₹4       │
│ [Compare]  [− 1 +]      │
└─────────────────────────┘

Desktop hover: elevation-2 + subtle scale(1.02)
Mobile: tap add → stepper expands inline
```

## Appendix B — API endpoints to add (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/buyer/products/compare` | Grouped multi-store prices |
| GET | `/buyer/deals/flash` | Active flash promotions |
| GET | `/buyer/brands` | Brand list with product counts |
| GET | `/buyer/brands/:slug/products` | Brand catalog |
| GET | `/buyer/recommendations/trending` | Trending products |
| GET | `/buyer/recommendations/fbt` | Frequently bought together |
| GET | `/buyer/recommendations/for-you` | Personalized |
| GET | `/buyer/wishlist` | List wishlist |
| POST | `/buyer/wishlist` | Add item |
| DELETE | `/buyer/wishlist/:productId` | Remove |
| POST | `/buyer/cart/coupon/validate` | Validate code |
| POST | `/buyer/cart/coupon/apply` | Apply to cart |
| GET | `/buyer/banners` | CMS hero/promo content |

## Appendix C — Accessibility checklist

- [ ] All interactive elements ≥ 44×44px on mobile
- [ ] Focus trap in search overlay, filter drawer, mini-cart
- [ ] `aria-live="polite"` on countdown timers and cart updates
- [ ] `aria-roledescription="carousel"` on all carousels
- [ ] Color contrast: teal `#0f766e` on white = 5.2:1 (AA ✅)
- [ ] Color contrast: text-secondary `#6b7280` on cream-1 = 4.6:1 (AA ✅)
- [ ] Skip link: "Skip to main content"
- [ ] Semantic landmarks: `header`, `nav`, `main`, `footer`
- [ ] Form labels on coupon input, search, address

## Appendix D — What we explicitly do NOT copy from BigBasket

- Green color palette
- BB font / wordmark styling
- Exact card aspect ratios or grid density
- Their header layout (we use location-first + teal)
- Their membership / BB Star patterns
- Basket iconography and illustration style
- Footer content blocks and newsletter UX

---

**Document version:** 1.0  
**Supersedes:** `BUYER_WEB_V2_UI_UPGRADE.md` (orange accent era)  
**Next action:** Sprint 1 implementation — teal tokens + location unification + floating cart
