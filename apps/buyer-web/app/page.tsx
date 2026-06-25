import { PageShell } from '@/components/layout/site-shell';
import { HomePageContent } from '@/features/home/home-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Compare prices. Save more.',
  description: 'Discover nearby stores, compare grocery prices, and order fresh essentials with fast delivery on JebDekho.',
  path: '/',
});

export default function HomePage() {
  return (
    <PageShell>
      <HomePageContent />
    </PageShell>
  );
}
