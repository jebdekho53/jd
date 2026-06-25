import { NotFoundContent } from '@/components/common/not-found-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Page not found',
  description: 'The page you are looking for does not exist on JebDekho.',
  noIndex: true,
});

export default function NotFound() {
  return <NotFoundContent />;
}
