import Link from 'next/link';
import { ApplyForm } from './apply-form';

const SUPPORT_EMAIL = 'support@jebdekho.com';

export const metadata = {
  title: 'Apply for a Franchise — JebDekho',
  description:
    'Apply to become a JebDekho franchise partner. Own an exclusive territory, recruit merchants with your own referral link, and earn on every order they take.',
};

const POINTS = [
  {
    title: 'Own an exclusive territory',
    body: 'Each pincode belongs to a single partner. The merchants you recruit there are yours.',
  },
  {
    title: 'Recruit merchants with your own link',
    body: 'Share your referral link. Every store that signs up through it is permanently attributed to you.',
  },
  {
    title: 'Earn on every order',
    body: 'You earn a share of the platform commission on all orders from the stores you bring on.',
  },
];

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-2">
        <section>
          <Link
            href="/"
            className="mb-3 inline-block text-sm font-semibold uppercase tracking-wide text-emerald-300 hover:text-emerald-200"
          >
            ← JebDekho Franchise
          </Link>
          <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
            Apply for a franchise
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Tell us about your city and territory. Our team reviews every application and gets
            back to you by email and SMS.
          </p>

          <dl className="mt-10 space-y-6">
            {POINTS.map(({ title, body }) => (
              <div key={title}>
                <dt className="text-sm font-semibold text-white">{title}</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-400">{body}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-sm text-slate-400">
            Already a partner?{' '}
            <Link href="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Questions?{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-300">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </section>

        <section>
          <ApplyForm />
        </section>
      </div>
    </main>
  );
}
