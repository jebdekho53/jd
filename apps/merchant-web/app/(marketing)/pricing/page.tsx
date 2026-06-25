import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent commission-based pricing for JebDekho merchants.',
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Simple, transparent pricing</h1>
        <p className="mt-3 text-slate-600">
          Pay only when you sell. No setup fees. Commission varies by category.
        </p>
        <div className="mt-10 rounded-2xl border border-brand-200 bg-white p-8 shadow-sm">
          <p className="text-4xl font-bold text-brand-600">8–15%</p>
          <p className="mt-2 text-slate-600">Platform commission per order</p>
          <ul className="mt-6 space-y-2 text-left text-sm text-slate-600">
            <li>✓ Free onboarding & store setup</li>
            <li>✓ Weekly settlements</li>
            <li>✓ Marketing tools included</li>
            <li>✓ Dedicated merchant support</li>
          </ul>
        </div>
        <Link
          href="/signup"
          className="mt-8 inline-flex rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Apply Now
        </Link>
      </section>
    </MarketingShell>
  );
}
