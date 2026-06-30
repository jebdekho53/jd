import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Privacy Policy | JebDekho',
  description:
    'Learn how JebDekho collects, uses, stores, and protects your personal information while using our hyperlocal marketplace.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      subtitle="Last updated: June 2026"
    >
      <p>
        At <strong>JebDekho</strong>, we value your privacy and are committed to
        protecting your personal information. This Privacy Policy explains how
        we collect, use, store, and safeguard your information when you use our
        website, mobile applications, and related services.
      </p>

      <p>
        JebDekho is owned and operated by{' '}
        <strong>UrbanMove Services Private Limited</strong>.
      </p>

      <h2>1. Information We Collect</h2>

      <ul>
        <li>Name, mobile number, and account details.</li>
        <li>Delivery addresses and saved locations.</li>
        <li>Order history and purchase information.</li>
        <li>Payment status and transaction details.</li>
        <li>Device information, browser type, and IP address.</li>
        <li>Location data (only with your permission).</li>
        <li>Customer support conversations and feedback.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>

      <ul>
        <li>Process and deliver your orders.</li>
        <li>Show nearby stores and available products.</li>
        <li>Provide customer support.</li>
        <li>Send order confirmations and delivery updates.</li>
        <li>Detect fraud and improve platform security.</li>
        <li>Improve our products and services.</li>
        <li>Comply with legal and regulatory obligations.</li>
      </ul>

      <h2>3. Location Information</h2>

      <p>
        With your permission, we use your location to display nearby stores,
        estimate delivery times, and improve search accuracy. You can disable
        location access anytime through your device settings.
      </p>

      <h2>4. Payments</h2>

      <p>
        Online payments are securely processed through trusted payment partners.
        JebDekho does not store your complete credit card, debit card, or UPI
        credentials on its servers.
      </p>

      <h2>5. Information Sharing</h2>

      <p>We only share information when necessary, including:</p>

      <ul>
        <li>Verified merchants fulfilling your order.</li>
        <li>Delivery partners handling your shipment.</li>
        <li>Payment gateways for transaction processing.</li>
        <li>Government authorities when legally required.</li>
      </ul>

      <p>
        <strong>We never sell your personal information.</strong>
      </p>

      <h2>6. Cookies & Analytics</h2>

      <p>
        We use cookies and similar technologies to remember your preferences,
        improve website performance, analyze usage patterns, and enhance your
        shopping experience.
      </p>

      <h2>7. Data Security</h2>

      <p>
        We use industry-standard security measures including encryption, secure
        authentication, access controls, and continuous monitoring to help
        protect your personal information.
      </p>

      <h2>8. Data Retention</h2>

      <p>
        We retain your information only for as long as necessary to provide our
        services, comply with legal requirements, resolve disputes, and enforce
        our policies.
      </p>

      <h2>9. Your Rights</h2>

      <ul>
        <li>Access your personal information.</li>
        <li>Update or correct your information.</li>
        <li>Request deletion of your account where applicable.</li>
        <li>Withdraw permissions such as location access.</li>
        <li>Contact us regarding privacy concerns.</li>
      </ul>

      <h2>10. Children&apos;s Privacy</h2>

      <p>
        JebDekho is not intended for children under the age permitted by
        applicable law. We do not knowingly collect personal information from
        children.
      </p>

      <h2>11. Changes to This Policy</h2>

      <p>
        We may update this Privacy Policy from time to time. Any changes will be
        published on this page with an updated revision date.
      </p>

      <h2>12. Contact Us</h2>

      <p>
        If you have questions about this Privacy Policy or how your data is
        handled, please contact us at{' '}
        <strong>support@jebdekho.com</strong>.
      </p>
    </StaticPageLayout>
  );
}
