import type { Redirect } from 'next/dist/lib/load-custom-routes';

/**
 * Permanent (308) legacy → canonical route redirects.
 *
 * Canonical public routes (single source of truth):
 *   Stores     → /store/[slug]
 *   Categories → /categories/[slug]
 *   Products   → /products/[id]
 *   Cities     → /city/[city] , /city/[city]/[category]
 *
 * Legacy paths kept alive so previously-shared merchant/category links, old
 * sitemap entries and inbound backlinks never 404. 308 preserves the method and
 * tells search engines the target is the permanent canonical.
 *
 * Exported separately from next.config so it can be unit-tested without booting
 * Next. Listing pages (/stores, /categories) are intentionally NOT redirected —
 * only their `[slug]` detail children move.
 */
export const SEO_REDIRECTS: Redirect[] = [
  // Store detail: /stores/{slug} → /store/{slug}. The bare /stores listing is
  // preserved (not matched, since :slug requires exactly one more segment).
  {
    source: '/stores/:slug',
    destination: '/store/:slug',
    permanent: true,
  },
  // Category detail doorway consolidation: /category/{slug} → /categories/{slug}
  {
    source: '/category/:slug',
    destination: '/categories/:slug',
    permanent: true,
  },
  // Bare /category (no listing page exists) → the real /categories listing.
  {
    source: '/category',
    destination: '/categories',
    permanent: true,
  },
];
