'use client';

import { Suspense } from 'react';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { SearchPageContent } from '@/features/search/search-page-content';

/** Offers page — deals-only search view */
export function OffersPageContent() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <SearchPageContent forcedDeals />
    </Suspense>
  );
}
