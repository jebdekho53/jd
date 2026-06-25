import { PageShell } from '@/components/layout/site-shell';
import { CategoriesPageContent } from '@/features/categories/categories-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Categories',
  description: 'Browse all grocery categories on JebDekho.',
  path: '/categories',
});

export default function CategoriesPage() {
  return (
    <PageShell>
      <CategoriesPageContent />
    </PageShell>
  );
}
