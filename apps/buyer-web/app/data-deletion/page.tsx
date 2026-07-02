import { StaticPageLayout } from '@/components/common/static-page-layout';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Data Deletion Instructions | JebDekho',
  description:
    'Learn how to request deletion of your JebDekho account, personal data, WhatsApp-linked data, order data, and support information.',
  path: '/data-deletion',
});

export default function DataDeletionPage() {
  return (
    <StaticPageLayout
      title="Data Deletion Instructions"
      subtitle="Last updated: July 2026"
    >
      <p>
        This page explains how JebDekho users, buyers, merchants, delivery
        partners, and franchise partners can request deletion of their account
        and eligible personal data from JebDekho and related services.
      </p>

      <p>
        JebDekho is owned and operated by{' '}
        <strong>UrbanMove Services Private Limited</strong>.
      </p>

      <h2>Who Can Request Data Deletion?</h2>

      <p>You may request deletion if you have used JebDekho as:</p>

      <ul>
        <li>A buyer or customer.</li>
        <li>A merchant, store owner, or seller partner.</li>
        <li>A delivery/rider partner.</li>
        <li>A franchise or business partner.</li>
        <li>A user who contacted JebDekho support.</li>
        <li>A user who interacted with JebDekho through WhatsApp, SMS, email, or push notifications.</li>
      </ul>

      <h2>How to Request Deletion</h2>

      <ol>
        <li>
          Send an email to <strong>support@jebdekho.com</strong> from the email
          address linked to your JebDekho account.
        </li>
        <li>
          Use the subject line <strong>Data Deletion Request</strong>.
        </li>
        <li>
          Include your registered mobile number, email address, and role on
          JebDekho, such as buyer, merchant, rider, or franchise partner.
        </li>
        <li>
          Clearly confirm that you want your JebDekho account and eligible
          personal data deleted.
        </li>
        <li>
          If your request relates to WhatsApp, include the WhatsApp phone number
          used with JebDekho.
        </li>
      </ol>

      <h2>Information to Include</h2>

      <ul>
        <li>Full name.</li>
        <li>Registered mobile number.</li>
        <li>Registered email address.</li>
        <li>WhatsApp number, if different.</li>
        <li>Your account type: buyer, merchant, rider, franchise, or support user.</li>
        <li>Store name or business name, if you are a merchant.</li>
        <li>Any relevant order ID, ticket ID, or payment reference, if applicable.</li>
      </ul>

      <h2>What We Delete</h2>

      <ul>
        <li>Account profile information.</li>
        <li>Saved addresses and contact details.</li>
        <li>Saved preferences, wishlist data, and notification preferences.</li>
        <li>WhatsApp-linked identifiers and messaging preferences.</li>
        <li>Support data that is no longer legally or operationally required.</li>
        <li>Inactive device tokens used for push notifications.</li>
        <li>Marketing communication preferences, where applicable.</li>
      </ul>

      <h2>Merchant, Rider, and Partner Data</h2>

      <p>
        If you are a merchant, rider, franchise, or business partner, some
        business records may need to be retained for operational, contractual,
        tax, payment, compliance, fraud-prevention, and dispute-resolution
        purposes. Eligible personal or inactive account data will be deleted
        or deactivated after verification.
      </p>

      <h2>WhatsApp Data</h2>

      <p>
        If you interacted with JebDekho through WhatsApp, we may process your
        WhatsApp phone number, message preferences, support messages, order
        updates, delivery updates, and communication logs. You can request
        deletion of eligible WhatsApp-linked data by mentioning your WhatsApp
        number in your deletion request.
      </p>

      <h2>Data We May Retain</h2>

      <p>
        Some records may be retained where required by law, tax rules, fraud
        prevention, dispute resolution, payment reconciliation, merchant
        settlements, delivery reconciliation, legal claims, regulatory
        obligations, or platform security.
      </p>

      <p>This may include:</p>

      <ul>
        <li>Order invoices and legally required transaction history.</li>
        <li>Payment, refund, settlement, wallet, and reconciliation records.</li>
        <li>Tax, GST, TDS/TCS, accounting, and audit records.</li>
        <li>Fraud-prevention, abuse-prevention, and security logs.</li>
        <li>Support tickets required for unresolved disputes.</li>
        <li>Merchant onboarding, KYC, business verification, and compliance records where retention is legally required.</li>
      </ul>

      <h2>Account Deactivation vs Deletion</h2>

      <p>
        In some cases, we may first deactivate your account to prevent further
        login or transactions while we verify and process the deletion request.
        Once eligible data is deleted, some retained records may remain in a
        restricted form only for legally required purposes.
      </p>

      <h2>Processing Timeline</h2>

      <p>
        We will acknowledge your request and process eligible deletion requests
        within <strong>30 days</strong>. If additional verification is required,
        we may contact you before completing the request.
      </p>

      <h2>Verification</h2>

      <p>
        To protect users from unauthorized deletion requests, we may verify your
        identity through your registered email, mobile number, OTP, support
        history, or business account details before processing the request.
      </p>

      <h2>After Deletion</h2>

      <ul>
        <li>You may lose access to your JebDekho account.</li>
        <li>Saved addresses, preferences, and communication settings may be removed.</li>
        <li>Past orders may no longer appear in your account, except where legally retained records are required.</li>
        <li>Merchant, rider, or franchise access may be disabled after verification.</li>
      </ul>

      <h2>Contact</h2>

      <p>
        For data deletion, privacy, or WhatsApp data concerns, contact{' '}
        <strong>support@jebdekho.com</strong>.
      </p>
    </StaticPageLayout>
  );
}