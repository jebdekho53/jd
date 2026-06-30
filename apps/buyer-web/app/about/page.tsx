import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'About JebDekho',
  description:
    'Learn about JebDekho, India’s hyperlocal marketplace that helps customers compare prices across nearby stores and shop smarter. Built by UrbanMove Services Private Limited.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <StaticPageLayout
      title="About JebDekho"
      subtitle="Compare Prices. Save More. Shop Smarter."
    >
      <p>
        <strong>JebDekho</strong> is a next-generation hyperlocal commerce
        platform that helps customers discover nearby stores, compare prices,
        and shop from trusted local merchants—all from one place.
      </p>

      <p>
        Our platform is designed to make everyday shopping more transparent,
        affordable, and convenient. Whether you&apos;re buying groceries, dairy
        products, fresh food, meat, electronics, personal care items, or daily
        essentials, JebDekho enables you to compare prices before making a
        purchase so you always get the best value.
      </p>

      <h2>Our Vision</h2>

      <p>
        To become India&apos;s most trusted hyperlocal marketplace by empowering
        local businesses with digital technology while helping customers make
        smarter shopping decisions through price transparency and convenience.
      </p>

      <h2>Our Mission</h2>

      <p>
        We believe neighbourhood businesses deserve the same digital
        opportunities as large retailers, and shoppers deserve complete pricing
        transparency before they buy.
      </p>

      <p>
        JebDekho bridges this gap by connecting buyers with verified local
        stores, enabling price comparison, faster deliveries, secure payments,
        and a seamless shopping experience.
      </p>

      <h2>What We Offer</h2>

      <ul>
        <li>Compare prices across multiple nearby stores</li>
        <li>Hyperlocal delivery from trusted merchants</li>
        <li>Verified local seller network</li>
        <li>Cash on Delivery and secure online payments</li>
        <li>Real-time product availability</li>
        <li>Easy product discovery and smart search</li>
        <li>Multiple product categories in one platform</li>
        <li>Reliable customer support</li>
      </ul>

      <h2>Why Choose JebDekho?</h2>

      <ul>
        <li>Save money by comparing prices before purchasing</li>
        <li>Support local businesses in your neighbourhood</li>
        <li>Quick delivery from nearby stores</li>
        <li>Trusted and verified merchant partners</li>
        <li>Transparent pricing with no hidden surprises</li>
        <li>Modern shopping experience built for everyday needs</li>
      </ul>

      <h2>About UrbanMove Services Private Limited</h2>

      <p>
        <strong>JebDekho</strong> is proudly owned and operated by{' '}
        <strong>UrbanMove Services Private Limited</strong>, a technology
        company focused on building innovative digital platforms that simplify
        commerce and empower local businesses.
      </p>

      <p>
        UrbanMove Services Private Limited develops scalable technology
        solutions across e-commerce, marketplaces, logistics, and digital
        services with the vision of making everyday life easier through
        innovation and technology.
      </p>

      <h2>Our Commitment</h2>

      <p>
        We are committed to building a trustworthy marketplace where customers
        can shop with confidence and local merchants can grow their businesses
        digitally. Every feature we build is focused on transparency,
        convenience, affordability, and delivering a better shopping experience.
      </p>

      <h2>Start Shopping</h2>

      <p>
        Ready to discover better prices?
      </p>

      <p>
        <Link href="/stores">Browse Nearby Stores</Link> •{' '}
        <Link href="/compare">Compare Prices</Link> •{' '}
        <Link href="/categories">Explore Categories</Link>
      </p>
    </StaticPageLayout>
  );
}
