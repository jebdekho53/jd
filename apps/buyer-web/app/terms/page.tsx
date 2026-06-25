import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Terms of service',
  description: 'Terms and conditions for using JebDekho buyer services.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <StaticPageLayout title="Terms of service" subtitle="Last updated: June 2026">
      <p>
        By using JebDekho, you agree to these terms. Please read them carefully before placing an
        order.
      </p>
      <h2>Service</h2>
      <p>
        JebDekho is a marketplace connecting buyers with independent local stores. We facilitate
        discovery, ordering, and payment but stores are responsible for product quality and
        fulfilment.
      </p>
      <h2>Accounts</h2>
      <p>
        You must provide accurate information and keep your account secure. You are responsible for
        activity under your account.
      </p>
      <h2>Orders & pricing</h2>
      <p>
        Prices are set by stores and may change. Order confirmation is subject to store acceptance
        and product availability.
      </p>
      <h2>Cancellations</h2>
      <p>
        You may cancel eligible orders from your order history. Stores may cancel orders for
        stock or operational reasons with applicable refunds.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        JebDekho is not liable for indirect damages arising from use of the platform, to the extent
        permitted by law.
      </p>
    </StaticPageLayout>
  );
}
