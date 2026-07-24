import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Contact partner support | JebDekho Rider',
  description:
    'How to reach JebDekho delivery partner support — in-app tickets, email, and what to do in an emergency.',
};

export default function ContactPage() {
  return (
    <PublicPageShell
      title="Contact us"
      subtitle="The fastest route depends on what has gone wrong."
    >
      <Section heading="An active delivery is going wrong">
        <p>
          Raise the ticket from the order itself, in the app. It attaches the order, your location,
          and the delivery state automatically, which is what lets operations act on it immediately
          rather than asking you for details first.
        </p>
      </Section>

      <Section heading="An account, KYC, or payout problem">
        <p>
          Use the Support tab in the app so the ticket is linked to your partner profile. If you
          cannot sign in at all, email{' '}
          <a href="mailto:support@jebdekho.com" className="text-rider-accent underline">
            support@jebdekho.com
          </a>{' '}
          from any address and include your registered mobile number.
        </p>
      </Section>

      <Section heading="Signing up, or a question before you join">
        <p>
          Email{' '}
          <a href="mailto:partners@jebdekho.com" className="text-rider-accent underline">
            partners@jebdekho.com
          </a>
          . Most answers are already on the{' '}
          <Link href="/about" className="text-rider-accent underline">
            partner page
          </Link>{' '}
          and in the{' '}
          <Link href="/faq" className="text-rider-accent underline">
            FAQ
          </Link>
          .
        </p>
      </Section>

      <Section heading="A privacy or data request">
        <p>
          Email{' '}
          <a href="mailto:support@jebdekho.com" className="text-rider-accent underline">
            support@jebdekho.com
          </a>{' '}
          with the subject line Data Deletion Request. The full process is on the{' '}
          <Link href="/data-deletion" className="text-rider-accent underline">
            data deletion page
          </Link>
          .
        </p>
      </Section>

      <Section heading="An emergency">
        <p className="rounded-xl bg-rider-danger/10 p-3 text-rider-danger">
          If you are hurt, in an accident, or in danger, call the emergency services on 112 first.
          Contact JebDekho afterwards. Do not wait on a support ticket.
        </p>
      </Section>

      <Section heading="Company">
        <p>
          JebDekho is owned and operated by UrbanMove Services Private Limited. Partner terms are set
          out in the{' '}
          <Link href="/agreement" className="text-rider-accent underline">
            Delivery Partner Agreement
          </Link>
          .
        </p>
      </Section>
    </PublicPageShell>
  );
}
