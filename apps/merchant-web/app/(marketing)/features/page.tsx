import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export const metadata: Metadata = {
  title: 'Features',
  description: 'JebDekho merchant platform features — analytics, delivery, CRM, GST, and more.',
};

const FEATURES = [
  'Real-time order management',
  'Delivery network integration',
  'GST invoicing & compliance',
  'Marketing & promotions',
  'Customer CRM tools',
  'AI growth insights',
  'Inventory governance',
  'Fast settlements',
];

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Platform Features</h1>
        <p className="mt-3 text-slate-600">
          Everything you need to run and grow your business on JebDekho.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-sm"
            >
              {f}
            </li>
          ))}
        </ul>
        <Link
          href="/signup"
          className="mt-10 inline-flex rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Start Selling
        </Link>
      </section>
    </MarketingShell>
  );
}
