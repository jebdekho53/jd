import { Suspense } from 'react';
import { PageLoading } from '@/components/common/page-loading';
import { ComparePageContent } from '@/features/compare/compare-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Compare prices',
  description: 'Compare grocery prices across nearby stores and find the best deal on JebDekho.',
  path: '/compare',
});

export default function ComparePage() {
  return (
    <Suspense fallback={<PageLoading variant="grid" />}>
      <ComparePageContent />
    </Suspense>
  );
}
