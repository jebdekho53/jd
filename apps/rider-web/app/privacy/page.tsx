import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section, Bullets } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Privacy for delivery partners | JebDekho Rider',
  description:
    'What location, identity, and delivery data JebDekho collects from delivery partners, why we collect it, who sees it, and how long we keep it.',
};

export default function RiderPrivacyPage() {
  return (
    <PublicPageShell
      title="Privacy for delivery partners"
      subtitle="What we collect from you, why, and who can see it."
      updated="July 2026"
    >
      <Section heading="Location data">
        <p>
          While you are online, the app reads your device GPS continuously and sends your position,
          heading, and speed to JebDekho. This is what lets us offer you nearby deliveries, show
          customers where their order is, and settle distance-based earnings.
        </p>
        <Bullets
          items={[
            'Location is collected only while you are online or on an active delivery. Going offline stops it.',
            'Customers see your live position only while their own order is out for delivery.',
            'Operations staff can see the live fleet map during working hours.',
            'Location history is retained for delivery disputes, earnings audits, and safety investigations.',
          ]}
        />
        <p>
          If you deny location permission the app cannot assign you deliveries. That is a functional
          limit, not a penalty — the assignment engine has no way to route work to an unknown
          position.
        </p>
      </Section>

      <Section heading="Identity and KYC documents">
        <p>
          During onboarding we collect your name, mobile number, vehicle details, and the documents
          you upload: ID proof, driving licence, PAN card, vehicle registration certificate, and a
          profile photo.
        </p>
        <Bullets
          items={[
            'KYC documents are used to verify your identity and right to work, and to meet our own regulatory obligations.',
            'They are visible to the JebDekho compliance team, not to customers or merchants.',
            'Your profile photo and first name are shown to customers and merchants on an active order.',
            'Your full documents are never shared with customers or merchants.',
          ]}
        />
      </Section>

      <Section heading="Financial data">
        <p>
          We store the bank account or UPI ID you add for payouts, your per-delivery earnings, your
          incentive progress, and every COD amount you collect and deposit. This data is used to pay
          you and to reconcile cash. It is visible to the JebDekho finance team.
        </p>
      </Section>

      <Section heading="Delivery and performance data">
        <p>
          We keep a record of every offer you receive, accept, reject, or fail to complete, along
          with pickup and drop timestamps, OTP verifications, customer ratings, and support tickets.
          This is used to run the assignment engine, resolve disputes, and review account standing.
        </p>
      </Section>

      <Section heading="Notifications">
        <p>
          We send you delivery offers, payout updates, and operational alerts over push notifications
          and WhatsApp on the number you registered. Operational messages are part of the service and
          cannot be switched off while your account is active.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Delivery, earnings, and COD records are retained for as long as tax and accounting law
          requires, even after your account closes. KYC documents are retained for the life of the
          account plus the statutory retention period. Live location history is retained for a
          shorter operational window and then aggregated.
        </p>
      </Section>

      <Section heading="Your choices">
        <Bullets
          items={[
            'You can go offline at any time, which stops location collection.',
            'You can update your bank or UPI details from the app at any time.',
            'You can request a copy of your data, or ask us to delete your account.',
          ]}
        />
        <p>
          See{' '}
          <Link href="/data-deletion" className="text-rider-accent underline">
            data deletion instructions
          </Link>{' '}
          for how to make a deletion request, or write to{' '}
          <a href="mailto:support@jebdekho.com" className="text-rider-accent underline">
            support@jebdekho.com
          </a>
          .
        </p>
      </Section>

      <Section heading="Who we are">
        <p>
          JebDekho is owned and operated by UrbanMove Services Private Limited. This page describes
          the handling of delivery partner data specifically. The platform-wide privacy policy at{' '}
          <a
            href="https://jebdekho.com/privacy"
            className="text-rider-accent underline"
            rel="noreferrer"
          >
            jebdekho.com/privacy
          </a>{' '}
          applies in addition to it, and controls where the two differ.
        </p>
      </Section>
    </PublicPageShell>
  );
}
