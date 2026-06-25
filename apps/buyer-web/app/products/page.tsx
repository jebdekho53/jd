import { ProductsPageContent } from '@/features/products/products-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Browse products',
  description: 'Discover groceries and essentials from nearby stores on JebDekho.',
  path: '/products',
});

export default function ProductsPage() {
  return <ProductsPageContent />;
}
