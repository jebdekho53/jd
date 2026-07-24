import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Delivery partner FAQ | JebDekho Rider',
  description:
    'Common questions from JebDekho delivery partners about signing up, KYC approval, going online, earnings, COD, and account issues.',
};

const GROUPS: { heading: string; items: [string, string][] }[] = [
  {
    heading: 'Signing up',
    items: [
      [
        'How do I sign up? I only see a sign-in screen.',
        'The same screen does both. Enter your mobile number, confirm the OTP, and if you do not have a partner profile yet the app takes you straight to the signup form. There is no separate signup page and no password.',
      ],
      [
        'I never received the OTP.',
        'The OTP is sent over WhatsApp to the number you entered, so that number must be on WhatsApp. Check that you typed all 10 digits, wait a minute, then use "Change number" to retry. If it still does not arrive, contact support.',
      ],
      [
        'Can I deliver without a motorcycle?',
        'Yes. You can register a scooter, bicycle, car, or select on foot. Which offers reach you depends on the vehicle you register, because distance and load limits differ.',
      ],
      [
        'Do I need a driving licence?',
        'Only if you deliver on a motor vehicle. Bicycle and on-foot partners still need ID proof and a PAN card.',
      ],
    ],
  },
  {
    heading: 'Approval and KYC',
    items: [
      [
        'How long does approval take?',
        'Documents are usually reviewed within two working days. Your current stage is always visible on your application status screen in the app.',
      ],
      [
        'My document was rejected. What now?',
        'Open the KYC screen, read the rejection reason on that document, and upload a clearer replacement. Most rejections are blurred photos, cropped edges, or an expired document.',
      ],
      [
        'Can I accept deliveries while my KYC is pending?',
        'No. You can sign in and look around, but you cannot go online until your documents are approved.',
      ],
    ],
  },
  {
    heading: 'Working',
    items: [
      [
        'Why am I not getting any offers?',
        'Check four things: you are approved, you have started a shift, you are toggled online, and location permission is granted. If all four are fine, there may simply be no orders near you right now.',
      ],
      [
        'Does the app need my location all the time?',
        'Only while you are online. Going offline stops location sharing. The app cannot assign you deliveries without it.',
      ],
      [
        'Can I reject an offer?',
        'Yes. Offers are optional and you can reject them. Repeatedly accepting and then abandoning deliveries is treated differently from rejecting up front — reject rather than abandon.',
      ],
      [
        'What if the customer is not reachable at the drop?',
        'Do not mark the order delivered. Use the failed-delivery flow on the order screen and raise a support ticket so operations can decide the next step.',
      ],
    ],
  },
  {
    heading: 'Money',
    items: [
      [
        'When do I get paid?',
        'Earnings accumulate against your profile and are settled to the bank account or UPI ID on file. Your earnings screen shows today, this week, pending payout, and total paid.',
      ],
      [
        'What do I do with cash I collect?',
        'That cash belongs to JebDekho. Deposit it through the COD screen, which shows exactly which orders and how much. You can deposit a partial amount if you need to, but the shortfall is flagged to finance.',
      ],
      [
        'Can I change my bank account?',
        'Yes, from the payout account screen. Payouts made before the change still go to the old account, so update it before your next settlement.',
      ],
    ],
  },
];

export default function FaqPage() {
  return (
    <PublicPageShell
      title="Frequently asked questions"
      subtitle="The things delivery partners ask us most."
    >
      {GROUPS.map((group) => (
        <Section key={group.heading} heading={group.heading}>
          <dl className="space-y-4">
            {group.items.map(([question, answer]) => (
              <div key={question}>
                <dt className="font-semibold text-rider-text">{question}</dt>
                <dd className="mt-1">{answer}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ))}

      <Section heading="Still stuck?">
        <p>
          Signed-in partners can raise a ticket from the Support tab in the app. Otherwise see the{' '}
          <Link href="/contact" className="text-rider-accent underline">
            contact page
          </Link>
          .
        </p>
      </Section>
    </PublicPageShell>
  );
}
