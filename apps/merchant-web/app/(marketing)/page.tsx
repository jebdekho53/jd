import type { Metadata } from 'next';
import { MerchantLandingContent } from '@/features/marketing/merchant-landing-content';

export const metadata: Metadata = {
  title: 'Grow Your Business with JebDekho',
  description:
    'Reach more customers, increase sales, and manage everything from one platform. Join JebDekho as a merchant partner.',
  openGraph: {
    title: 'Grow Your Business with JebDekho',
    description: 'Reach more customers and manage your store from one platform.',
    type: 'website',
    url: 'https://merchant.jebdekho.com',
    siteName: 'JebDekho Merchant',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grow Your Business with JebDekho',
    description: 'Join India\'s hyperlocal commerce platform.',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JebDekho',
  url: 'https://merchant.jebdekho.com',
  description: 'Hyperlocal commerce platform for merchants',
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <MerchantLandingContent />
    </>
  );
}
