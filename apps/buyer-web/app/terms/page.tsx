import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Terms of Service | JebDekho',
  description:
    'Read the terms and conditions for using JebDekho, a hyperlocal marketplace owned and operated by UrbanMove Services Private Limited.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <StaticPageLayout title="Terms of Service" subtitle="Last updated: June 2026">
      <p>
        These Terms of Service govern your access to and use of JebDekho. By
        using our platform, browsing stores, comparing prices, placing orders,
        or making payments, you agree to follow these terms.
      </p>

      <h2>1. About JebDekho</h2>
      <p>
        JebDekho is a hyperlocal marketplace owned and operated by{' '}
        <strong>UrbanMove Services Private Limited</strong>. The platform
        connects customers with independent local merchants for product
        discovery, price comparison, ordering, payments, and delivery support.
      </p>

      <h2>2. Marketplace Role</h2>
      <p>
        JebDekho acts as a technology platform between buyers and local
        merchants. Merchants are responsible for product pricing, availability,
        quality, packaging, and fulfilment of accepted orders.
      </p>

      <h2>3. User Accounts</h2>
      <ul>
        <li>You must provide accurate mobile number, address, and profile details.</li>
        <li>You are responsible for maintaining the security of your account.</li>
        <li>You must not misuse another person&apos;s account or information.</li>
        <li>JebDekho may suspend accounts involved in fraud or misuse.</li>
      </ul>

      <h2>4. Orders and Pricing</h2>
      <ul>
        <li>Product prices are set by individual merchants.</li>
        <li>Prices, discounts, and availability may change before checkout.</li>
        <li>Final payable amount is shown before you confirm your order.</li>
        <li>Order confirmation depends on merchant acceptance and stock availability.</li>
      </ul>

      <h2>5. Payments</h2>
      <p>
        JebDekho may support online payments through payment partners and Cash
        on Delivery where available. Online payment failures, reversals, and
        refund timelines may depend on banks, payment gateways, and applicable
        processing rules.
      </p>

      <h2>6. Delivery</h2>
      <p>
        Delivery timelines are estimates and may vary due to merchant
        preparation time, product availability, distance, traffic, weather,
        operational load, or third-party delivery partner delays.
      </p>

      <h2>7. Cancellations and Refunds</h2>
      <p>
        Eligible orders may be cancelled before the merchant starts processing
        them. Refunds, replacements, and returns are handled according to the
        Refund Policy, product category, merchant policy, and order status.
      </p>

      <h2>8. User Responsibilities</h2>
      <ul>
        <li>Use JebDekho only for lawful purposes.</li>
        <li>Provide correct delivery and contact information.</li>
        <li>Do not place fake, fraudulent, or abusive orders.</li>
        <li>Do not misuse offers, coupons, refunds, or platform features.</li>
      </ul>

      <h2>9. Prohibited Activities</h2>
      <ul>
        <li>Attempting to hack, disrupt, or damage the platform.</li>
        <li>Using false identity, fake addresses, or misleading information.</li>
        <li>Copying platform content, design, data, or technology without permission.</li>
        <li>Harassing merchants, delivery partners, support staff, or other users.</li>
      </ul>

      <h2>10. Intellectual Property</h2>
      <p>
        JebDekho&apos;s name, logo, design, software, platform content, and
        related assets belong to UrbanMove Services Private Limited or its
        licensors. You may not copy, modify, or misuse them without written
        permission.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, JebDekho and UrbanMove Services
        Private Limited will not be liable for indirect, incidental, special, or
        consequential losses arising from use of the platform.
      </p>

      <h2>12. Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of JebDekho
        after updates means you accept the revised terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        For questions about these Terms of Service, contact us at{' '}
        <strong>support@jebdekho.com</strong>.
      </p>
    </StaticPageLayout>
  );
}