import { Suspense } from 'react';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { SearchPageContent } from '@/features/search/search-page-content';

export default function SearchPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
