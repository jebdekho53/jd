import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'About JebDekho',
  description: 'JebDekho connects you with nearby stores to compare prices and save on groceries.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <StaticPageLayout title="About JebDekho" subtitle="Compare prices. Save more.">
      <p>
        JebDekho is a hyperlocal grocery marketplace that helps you discover neighbourhood stores,
        compare prices across vendors, and order fresh groceries with fast delivery.
      </p>
      <h2>Our mission</h2>
      <p>
        We believe local vendors deserve a digital storefront and buyers deserve transparency.
        JebDekho makes it easy to check your pocket before buying — finding the best price from
        stores near you.
      </p>
      <h2>What we offer</h2>
      <ul>
        <li>Price comparison across nearby stores</li>
        <li>Fast hyperlocal delivery</li>
        <li>Cash on Delivery and online payments</li>
        <li>Verified local merchant partners</li>
      </ul>
      <p>
        Ready to shop?{' '}
        <Link href="/stores">Browse stores</Link> or{' '}
        <Link href="/compare">compare prices</Link>.
      </p>
    </StaticPageLayout>
  );
}
