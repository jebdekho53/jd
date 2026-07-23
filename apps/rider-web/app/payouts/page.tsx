import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageShell, Section, Bullets } from '@/features/public/public-page-shell';

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title: 'Payout and COD policy | JebDekho Rider',
  description:
    'How JebDekho delivery partner earnings are calculated and settled, and the rules for handling and depositing cash on delivery.',
};

export default function PayoutsPage() {
  return (
    <PublicPageShell
      title="Payouts and cash on delivery"
      subtitle="How you earn, how you get paid, and what to do with cash you collect."
      updated="July 2026"
    >
      <Section heading="What you earn">
        <p>
          Each completed delivery earns a fee. On top of that you keep any incentive you qualify for
          — those are shown as quests on the Incentives screen with live progress against the target.
        </p>
        <Bullets
          items={[
            'A delivery earns its fee only once it is marked delivered and OTP-verified.',
            'Rejected offers cost you nothing.',
            'A failed delivery is reviewed by operations before any partial fee is applied.',
            'Incentive rewards are credited once the quest target is met, not proportionally as you progress.',
          ]}
        />
      </Section>

      <Section heading="How you get paid">
        <p>
          Earnings accrue against your profile and settle to the bank account or UPI ID you add on
          the payout account screen. The earnings screen shows today, this week, pending payout, and
          total paid, so you can always see which bucket your money is in.
        </p>
        <Bullets
          items={[
            'The account must be in your own name. Payouts to third-party accounts are rejected by the bank.',
            'Update your details before a settlement runs — payouts already sent cannot be redirected.',
            'Bank transfers can take up to two working days to appear in your account.',
          ]}
        />
      </Section>

      <Section heading="Cash on delivery">
        <p>
          Cash you collect on a COD order is JebDekho&apos;s money that you are holding, not your
          earnings. It is tracked per order from the moment you mark the delivery complete.
        </p>
        <Bullets
          items={[
            'Collect the exact amount shown on the order. Do not accept part payment.',
            'Keep COD cash separate from your own money.',
            'Deposit it through the COD screen, which lists every order and amount you are still holding.',
            'Deposit promptly — an unreconciled balance that keeps growing can pause your account.',
          ]}
        />
      </Section>

      <Section heading="If the amount does not match">
        <p>
          The COD screen lets you deselect orders and enter the amount you are actually depositing,
          so a partial deposit is always possible. The difference is recorded as a mismatch and
          reviewed by finance.
        </p>
        <p>
          Always add a note explaining a shortfall or an excess. A mismatch with an explanation is
          resolved quickly; a silent one gets escalated.
        </p>
      </Section>

      <Section heading="Deductions">
        <p>
          JebDekho may set off an unpaid COD balance, a confirmed customer refund caused by partner
          error, or a recovered incentive paid in error against your pending earnings. Any such
          deduction is itemised against your account. The{' '}
          <Link href="/agreement" className="text-rider-accent underline">
            Delivery Partner Agreement
          </Link>{' '}
          governs when this can happen.
        </p>
      </Section>

      <Section heading="Tax">
        <p>
          Delivery partners are independent contractors, so JebDekho does not deduct income tax at
          source from your earnings as an employer would. You are responsible for your own tax
          filing. Your PAN is collected at onboarding for statutory reporting.
        </p>
      </Section>

      <Section heading="Disputes">
        <p>
          If an earning, deduction, or COD figure looks wrong, raise a support ticket from the app
          with the order number and the date. Do not adjust your deposit to compensate — that creates
          a second mismatch on top of the first.
        </p>
      </Section>
    </PublicPageShell>
  );
}
