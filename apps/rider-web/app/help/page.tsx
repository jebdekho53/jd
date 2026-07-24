import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Help centre | JebDekho Rider',
  description:
    'Fix the most common JebDekho delivery partner problems: no offers, OTP not arriving, KYC rejected, COD mismatch, payout not received.',
};

const PLAYBOOKS: { problem: string; steps: string[] }[] = [
  {
    problem: 'I am online but getting no offers',
    steps: [
      'Confirm your application status shows Approved.',
      'Start a shift from the Shifts screen — being online without an active shift is not enough.',
      'Check the online toggle on the home screen is on.',
      'Check location permission is granted and GPS is not showing a weak or denied state.',
      'If all four are correct, there may be no orders near you. Move towards a busier market area.',
    ],
  },
  {
    problem: 'The OTP is not arriving',
    steps: [
      'The OTP goes to WhatsApp, so the number must be active on WhatsApp.',
      'Check you entered all 10 digits without the country code.',
      'Wait 60 seconds before retrying — repeated requests do not arrive faster.',
      'Use "Change number" to start again if you mistyped it.',
    ],
  },
  {
    problem: 'My KYC document was rejected',
    steps: [
      'Open the KYC screen — the rejection reason is shown against the specific document.',
      'Retake the photo in good light with all four corners of the document visible.',
      'Check the document has not expired.',
      'Upload the replacement and submit again. You do not need to re-upload documents that were approved.',
    ],
  },
  {
    problem: 'The delivery OTP is not working',
    steps: [
      'Confirm you are reading the code the customer gives you, not the order number.',
      'For a COD order, tick the cash-collected confirmation first — the app blocks completion until you do.',
      'If the customer has no code, do not mark it delivered. Raise a support ticket from the order.',
    ],
  },
  {
    problem: 'My COD amount does not match',
    steps: [
      'Open the COD screen and check the per-order breakdown against the cash you actually hold.',
      'Deselect any order you have not collected cash for.',
      'Enter the amount you are really depositing rather than the expected total.',
      'Add a note explaining the difference. Finance reviews every mismatch, and a note resolves it far faster.',
    ],
  },
  {
    problem: 'I have not received my payout',
    steps: [
      'Check the payout account screen — a wrong IFSC or a UPI ID in someone else\'s name is the usual cause.',
      'Check the earnings screen for the pending payout figure and whether it has moved to total paid.',
      'Bank transfers can take up to two working days to appear.',
      'If it is still missing after that, raise a support ticket with the date and amount.',
    ],
  },
  {
    problem: 'The app is stuck or the screen is blank',
    steps: [
      'Pull down to refresh, or close and reopen the app.',
      'If you are on a weak network the app will show cached data until it reconnects.',
      'Sign out and back in only as a last resort — you will need your OTP again.',
    ],
  },
];

export default function HelpPage() {
  return (
    <PublicPageShell
      title="Help centre"
      subtitle="Step-by-step fixes for the problems partners hit most often."
    >
      {PLAYBOOKS.map((playbook) => (
        <Section key={playbook.problem} heading={playbook.problem}>
          <ol className="list-decimal space-y-1.5 pl-5">
            {playbook.steps.map((step) => (
              <li key={step.slice(0, 60)}>{step}</li>
            ))}
          </ol>
        </Section>
      ))}

      <Section heading="Nothing here fixed it">
        <p>
          Signed-in partners should raise a ticket from the Support tab so it lands against your
          account with the order attached. Otherwise see the{' '}
          <Link href="/contact" className="text-rider-accent underline">
            contact page
          </Link>
          , or browse the{' '}
          <Link href="/faq" className="text-rider-accent underline">
            FAQ
          </Link>
          .
        </p>
      </Section>
    </PublicPageShell>
  );
}
