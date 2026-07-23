import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section, Bullets } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Delete my delivery partner account | JebDekho Rider',
  description:
    'How a JebDekho delivery partner can request deletion of their account, KYC documents, location history, and personal data.',
};

export default function RiderDataDeletionPage() {
  return (
    <PublicPageShell
      title="Delete my account and data"
      subtitle="How to close your delivery partner account and what happens to your data."
      updated="July 2026"
    >
      <Section heading="Before you request deletion">
        <p>
          Settle anything outstanding first. A deletion request cannot be completed while you still
          hold JebDekho cash or are owed money.
        </p>
        <Bullets
          items={[
            'Deposit any COD cash still showing on your COD screen.',
            'Make sure your bank or UPI details are correct so any pending payout can reach you.',
            'Close or resolve any open support tickets or delivery disputes.',
          ]}
        />
      </Section>

      <Section heading="How to request deletion">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Email{' '}
            <a href="mailto:support@jebdekho.com" className="text-rider-accent underline">
              support@jebdekho.com
            </a>{' '}
            with the subject line <b className="text-rider-text">Data Deletion Request</b>.
          </li>
          <li>
            Send it from the email address on your account, or include your registered mobile number
            so we can match the request to your profile.
          </li>
          <li>
            State that you are a <b className="text-rider-text">delivery partner</b> and that you
            want your account and eligible personal data deleted.
          </li>
          <li>
            We will confirm your identity over your registered mobile number before acting on the
            request.
          </li>
        </ol>
        <p>
          We acknowledge requests within 7 working days and complete eligible deletion within 30
          days.
        </p>
      </Section>

      <Section heading="What gets deleted">
        <Bullets
          items={[
            'Your profile: name, photo, vehicle details, and contact information.',
            'Your uploaded KYC documents, once the statutory retention period has passed.',
            'Your live and historical location data.',
            'Your saved bank account and UPI details.',
            'Your push notification and WhatsApp subscriptions.',
          ]}
        />
      </Section>

      <Section heading="What we must keep">
        <p>
          Some records cannot be deleted on request because law requires us to retain them. These are
          kept in a restricted form, are not used to contact you, and are not used for any
          operational purpose.
        </p>
        <Bullets
          items={[
            'Delivery, earnings, invoice, and tax records, for the retention period Indian tax and accounting law requires.',
            'COD collection and deposit records needed to close out cash reconciliation.',
            'Records tied to an open dispute, safety investigation, or legal claim, until it is resolved.',
          ]}
        />
      </Section>

      <Section heading="After deletion">
        <p>
          Your account is closed and you can no longer sign in or accept deliveries. If you want to
          deliver with JebDekho again later you can sign up fresh with the same mobile number — you
          will need to complete KYC again from the start.
        </p>
      </Section>

      <Section heading="Questions">
        <p>
          Write to{' '}
          <a href="mailto:support@jebdekho.com" className="text-rider-accent underline">
            support@jebdekho.com
          </a>
          , or read what we collect and why on the{' '}
          <Link href="/privacy" className="text-rider-accent underline">
            partner privacy page
          </Link>
          .
        </p>
      </Section>
    </PublicPageShell>
  );
}
