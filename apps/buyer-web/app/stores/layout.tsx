import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Nearby stores',
  description: 'Discover local grocery stores delivering to your area on JebDekho.',
  path: '/stores',
});

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
