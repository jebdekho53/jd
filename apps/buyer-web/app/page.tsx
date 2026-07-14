import { PageShell } from '@/components/layout/site-shell';
import { HomePageContent } from '@/features/home/home-page-content';
import { createPageMetadata, webSiteJsonLd, serializeJsonLd } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Compare prices. Save more.',
  description: 'Discover nearby stores, compare grocery prices, and order fresh essentials with fast delivery on JebDekho.',
  path: '/',
});

// WebSite + SearchAction on the homepage only (the sitelinks search box target
// /search?q= is a real, working route). Organization is emitted site-wide by the
// root layout, so it is intentionally not repeated here.
const websiteSchema = webSiteJsonLd();

export default function HomePage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
      />
      <HomePageContent />
    </PageShell>
  );
}
