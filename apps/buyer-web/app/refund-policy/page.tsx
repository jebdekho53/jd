import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Refund policy',
  description: 'JebDekho refund and cancellation policy for buyer orders.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <StaticPageLayout title="Refund policy" subtitle="Last updated: June 2026">
      <h2>Cancellations</h2>
      <p>
        Orders can be cancelled before the store starts preparation. Go to Orders → select your
        order → Cancel. Cancellation eligibility depends on order status.
      </p>
      <h2>Refunds for online payments</h2>
      <p>
        Approved refunds for UPI, card, or net banking payments are processed to the original
        payment method within 5–7 business days.
      </p>
      <h2>COD orders</h2>
      <p>
        Refunds for Cash on Delivery orders are issued via UPI or store credit as coordinated by
        our support team.
      </p>
      <h2>Missing or incorrect items</h2>
      <p>
        Report issues within 24 hours of delivery via Contact support. We work with the store to
        resolve partial refunds or replacements where applicable.
      </p>
      <h2>Contact</h2>
      <p>Email support@jebdekho.com with your order number for refund assistance.</p>
    </StaticPageLayout>
  );
}
