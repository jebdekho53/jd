import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Refund & Cancellation Policy | JebDekho',
  description:
    'Learn about JebDekho refund, cancellation, replacement, and return policies for orders placed through our hyperlocal marketplace.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <StaticPageLayout
      title="Refund & Cancellation Policy"
      subtitle="Last updated: June 2026"
    >
      <p>
        At <strong>JebDekho</strong>, customer satisfaction is our priority. This
        Refund & Cancellation Policy explains how cancellations, refunds,
        replacements, and returns are handled for orders placed through our
        platform.
      </p>

      <p>
        JebDekho is owned and operated by{' '}
        <strong>UrbanMove Services Private Limited</strong>.
      </p>

      <h2>1. Order Cancellation</h2>

      <p>
        Orders can generally be cancelled before the merchant starts preparing
        or processing them. Once preparation or dispatch has started,
        cancellation may no longer be available.
      </p>

      <ul>
        <li>Open your Orders page.</li>
        <li>Select the order you wish to cancel.</li>
        <li>Choose Cancel Order if eligible.</li>
      </ul>

      <h2>2. Cancellation Eligibility</h2>

      <ul>
        <li>Order status.</li>
        <li>Merchant acceptance.</li>
        <li>Preparation stage.</li>
        <li>Dispatch status.</li>
      </ul>

      <h2>3. Refund Eligibility</h2>

      <p>Refunds may be approved if:</p>

      <ul>
        <li>The order is cancelled before fulfilment.</li>
        <li>The merchant cannot fulfil the order.</li>
        <li>You receive damaged products.</li>
        <li>You receive incorrect products.</li>
        <li>Items are missing from your order.</li>
        <li>Payment is successfully charged but the order fails.</li>
      </ul>

      <h2>4. Non-Refundable Products</h2>

      <p>
        Certain products may not be eligible for refunds or returns due to
        hygiene, food safety, or merchant-specific policies. These may include
        perishable goods, opened personal care products, and other restricted
        categories.
      </p>

      <h2>5. Damaged or Incorrect Products</h2>

      <p>
        If you receive damaged, expired, or incorrect products, please report
        the issue as soon as possible through Customer Support with clear photos
        and your order details. Eligible cases may receive a replacement,
        partial refund, or full refund after verification.
      </p>

      <h2>6. Missing Items</h2>

      <p>
        If any item is missing from your order, report it promptly through the
        Help Center or Contact Support. After verification with the merchant,
        the missing item may be delivered separately or refunded.
      </p>

      <h2>7. Replacement Policy</h2>

      <p>
        Depending on product availability and merchant approval, eligible items
        may be replaced instead of refunded.
      </p>

      <h2>8. Refund Timeline</h2>

      <ul>
        <li>UPI refunds: usually within 2–5 business days.</li>
        <li>Debit/Credit Card refunds: usually within 5–7 business days.</li>
        <li>Net Banking refunds: depending on your bank.</li>
        <li>Wallet refunds: as per the wallet provider&apos;s processing time.</li>
      </ul>

      <h2>9. Cash on Delivery (COD) Refunds</h2>

      <p>
        Refunds for Cash on Delivery orders may be processed through UPI, bank
        transfer, wallet credit, or another approved method after successful
        verification.
      </p>

      <h2>10. Merchant Verification</h2>

      <p>
        Every refund or replacement request is reviewed in coordination with the
        respective merchant before approval. Additional information or photos
        may be requested to complete the verification process.
      </p>

      <h2>11. Customer Responsibilities</h2>

      <ul>
        <li>Check your order at the time of delivery whenever possible.</li>
        <li>Report issues promptly.</li>
        <li>Provide accurate information and supporting photographs.</li>
        <li>Cooperate with our support team during verification.</li>
      </ul>

      <h2>12. Contact Support</h2>

      <p>
        For refund, cancellation, replacement, or return assistance, please
        contact our Customer Support team at{' '}
        <strong>support@jebdekho.com</strong> with your order number and a brief
        description of the issue.
      </p>
    </StaticPageLayout>
  );
}
