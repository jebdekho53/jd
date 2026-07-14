import Link from 'next/link';
import { ApplyForm } from './apply-form';

const SUPPORT_EMAIL = 'support@jebdekho.com';

export const metadata = {
  title: 'Become a JebDekho Franchise Partner',
  description:
    'Run a JebDekho franchise in your city. Recruit local merchants, own an exclusive territory, and earn on every order they take.',
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

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-2">
        <section>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
            JebDekho Franchise
          </p>
          <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
            Build the marketplace in your city
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Partner with JebDekho, bring local stores online, and earn from every order they
            fulfil.
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
