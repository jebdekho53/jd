import Link from 'next/link';
import { ApplyForm } from './apply-form';

const SUPPORT_EMAIL = 'support@jebdekho.com';

export const metadata = {
  title: 'Become a JebDekho Supply-Chain Vendor',
  description:
    'Supply products to JebDekho merchants across categories. Apply to become an approved vendor partner.',
};

const POINTS = [
  {
    title: 'Sell into every merchant on the platform',
    body: 'Your catalog becomes available for JebDekho merchants to stock and sell in their stores.',
  },
  {
    title: 'One dashboard for orders',
    body: 'Track incoming purchase orders from merchants and manage fulfilment in one place.',
  },
  {
    title: 'Reliable, predictable settlements',
    body: 'Get paid on a fixed cycle for every order fulfilled through the platform.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-2">
        <section>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-300">
            JebDekho Vendor
          </p>
          <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
            Supply the marketplace behind every store
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Partner with JebDekho as a supply-chain vendor and fulfil orders from merchants across
            the platform.
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
            Already a vendor?{' '}
            <Link href="/login" className="font-semibold text-violet-300 hover:text-violet-200">
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
