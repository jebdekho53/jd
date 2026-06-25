import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { FAQ_ITEMS } from '@/content/help-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'FAQs',
  description: 'Frequently asked questions about JebDekho orders, delivery, and payments.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <StaticPageLayout title="Frequently asked questions" subtitle="Quick answers to common questions">
      <div className="not-prose space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="rounded-2xl border border-border/50 bg-card p-4 shadow-card">
            <summary className="cursor-pointer font-semibold text-jd-text-primary">{item.q}</summary>
            <p className="mt-3 text-sm text-jd-text-muted">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="not-prose mt-8 text-sm text-jd-text-muted">
        More questions? Visit the{' '}
        <Link href="/help" className="font-medium text-primary hover:underline">help center</Link>.
      </p>
    </StaticPageLayout>
  );
}
