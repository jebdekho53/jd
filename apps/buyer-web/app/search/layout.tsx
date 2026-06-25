import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Search products',
  description: 'Search and compare grocery prices across nearby stores on JebDekho.',
  path: '/search',
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
