import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section, Bullets } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Become a delivery partner | JebDekho Rider',
  description:
    'Earn on your own schedule as a JebDekho delivery partner. Sign up with your mobile number, upload KYC, and start accepting deliveries.',
};

const STEPS = [
  ['Verify your number', 'Enter your mobile number and confirm the OTP we send on WhatsApp.'],
  ['Add your details', 'Your name and vehicle — motorcycle, scooter, bicycle, car, or on foot.'],
  ['Upload KYC', 'ID proof, driving licence, PAN, vehicle RC, and a profile photo.'],
  ['Go online', 'Once approved, start a shift and accept delivery offers near you.'],
];

export default function AboutPage() {
  return (
    <PublicPageShell
      title="Deliver with JebDekho"
      subtitle="Work the hours you choose, get paid for every delivery, and keep your incentives."
    >
      <div className="rounded-2xl border border-rider-accent/40 bg-rider-accent/10 p-5">
        <p className="text-sm text-rider-text">
          Signing up takes a few minutes and needs nothing but your mobile number to start.
        </p>
        <Link
          href="/login"
          className="mt-4 grid h-12 w-full place-items-center rounded-xl bg-rider-accent font-bold text-rider-accent-foreground"
        >
          Start signing up
        </Link>
      </div>

      <Section heading="How it works">
        <ol className="space-y-3">
          {STEPS.map(([title, body], index) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rider-accent text-sm font-black text-rider-accent-foreground">
                {index + 1}
              </span>
              <span>
                <b className="text-rider-text">{title}</b>
                <span className="block">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section heading="What you need">
        <Bullets
          items={[
            'A mobile number that can receive WhatsApp messages.',
            'A smartphone with working GPS — location sharing is required while you are online.',
            'Government ID proof and a PAN card.',
            'A valid driving licence and vehicle registration certificate, if you deliver on a motor vehicle.',
            'A bank account or UPI ID in your own name to receive payouts.',
          ]}
        />
      </Section>

      <Section heading="How you get paid">
        <p>
          You earn a fee on every completed delivery, plus any incentives you qualify for. Earnings
          are tracked live in the app and settled to the bank account or UPI ID on your profile.
        </p>
        <p>
          If you collect cash on delivery, that cash belongs to JebDekho and must be deposited
          through the COD screen in the app. Read the{' '}
          <Link href="/payouts" className="text-rider-accent underline">
            payout and COD policy
          </Link>{' '}
          for the full detail.
        </p>
      </Section>

      <Section heading="Your status as a partner">
        <p>
          Delivery partners on JebDekho are independent contractors. You decide when to go online and
          which offers to accept. This is not an employment relationship, and no minimum hours or
          minimum earnings are guaranteed. The{' '}
          <Link href="/agreement" className="text-rider-accent underline">
            Delivery Partner Agreement
          </Link>{' '}
          sets out the full terms, and you accept it during signup.
        </p>
      </Section>
    </PublicPageShell>
  );
}
