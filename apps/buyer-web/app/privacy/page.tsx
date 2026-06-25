import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Privacy policy',
  description: 'JebDekho privacy policy — how we collect, use, and protect your data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <StaticPageLayout title="Privacy policy" subtitle="Last updated: June 2026">
      <p>
        JebDekho (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what
        information we collect and how we use it when you use our buyer web application and services.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Phone number and profile information for account creation</li>
        <li>Delivery addresses you save</li>
        <li>Order history and payment status</li>
        <li>Device and usage data for security and analytics</li>
        <li>Location data to show nearby stores (with your consent)</li>
      </ul>
      <h2>How we use your information</h2>
      <p>
        We use your data to process orders, show relevant stores and products, prevent fraud,
        improve our services, and communicate order updates.
      </p>
      <h2>Data sharing</h2>
      <p>
        We share order and delivery details with merchant partners fulfilling your order and
        payment processors (e.g. Razorpay) for online payments. We do not sell your personal data.
      </p>
      <h2>Your rights</h2>
      <p>
        You may request access, correction, or deletion of your data by contacting
        support@jebdekho.com.
      </p>
      <h2>Contact</h2>
      <p>Questions about privacy? Email support@jebdekho.com.</p>
    </StaticPageLayout>
  );
}
