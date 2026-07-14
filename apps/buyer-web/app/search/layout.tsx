import { createPageMetadata } from '@/lib/seo/metadata';

// Search result pages (and every ?q=/filter/sort/location/page combination that
// renders through this layout) are noindex,follow: they must never pollute the
// index with infinite thin/duplicate permutations, but the product/store links
// inside them stay crawlable.
export const metadata = createPageMetadata({
  title: 'Search products',
  description: 'Search and compare grocery prices across nearby stores on JebDekho.',
  path: '/search',
  noIndex: true,
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
