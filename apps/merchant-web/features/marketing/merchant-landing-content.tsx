'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MarketingShell } from './components/marketing-shell';
import { fetchOnboardingStats } from '@/services/onboarding/onboarding-api';

const BENEFITS = [
  { title: 'More Sales', desc: 'Reach thousands of nearby customers' },
  { title: 'Marketing Support', desc: 'Promotions, ads, and campaigns' },
  { title: 'Delivery Network', desc: 'Rider fleet for fast delivery' },
  { title: 'Analytics', desc: 'Real-time business insights' },
  { title: 'GST Invoices', desc: 'Automated tax compliance' },
  { title: 'Fast Settlements', desc: 'Weekly payouts to your bank' },
  { title: 'CRM Tools', desc: 'Know and retain your customers' },
  { title: 'AI Growth Insights', desc: 'Smart recommendations to grow' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Kumar',
    store: 'Fresh Mart, Pune',
    quote: 'Orders doubled in 3 months after joining JebDekho.',
  },
  {
    name: 'Priya Sharma',
    store: 'Spice Kitchen, Bengaluru',
    quote: 'The dashboard makes managing orders effortless.',
  },
];

const FAQ = [
  {
    q: 'How long does approval take?',
    a: 'Most applications are reviewed within 2–3 business days.',
  },
  {
    q: 'What documents do I need?',
    a: 'PAN, GST (if applicable), shop license, FSSAI for food, and bank proof.',
  },
  {
    q: 'Is there a signup fee?',
    a: 'No. Onboarding is free. You pay commission only on orders.',
  },
];

export function MerchantLandingContent() {
  const { data: stats } = useQuery({
    queryKey: ['merchant', 'stats'],
    queryFn: fetchOnboardingStats,
  });

  const statItems = [
    { label: 'Active customers', value: stats?.activeCustomers ?? '10K+' },
    { label: 'Orders delivered', value: stats?.ordersDelivered ?? '50K+' },
    { label: 'Cities served', value: stats?.citiesServed ?? '5+' },
    { label: 'Merchant partners', value: stats?.merchantPartners ?? '500+' },
  ];

  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-slate-900 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Grow Your Business with JebDekho
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-white/90"
          >
            Reach more customers, increase sales, and manage everything from one platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              Start Selling
            </Link>
            <a
              href="mailto:partners@jebdekho.com?subject=Book%20Demo"
              className="rounded-lg border border-white/40 px-6 py-3 font-semibold hover:bg-white/10"
            >
              Book Demo
            </a>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-12 sm:grid-cols-4">
        {statItems.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-brand-600">
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">Why sell on JebDekho?</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-slate-100 bg-surface p-5"
              >
                <h3 className="font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold">Merchant success stories</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-sm font-medium text-brand-700">
                  {t.name} — {t.store}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold">FAQ</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-slate-200 bg-surface p-4"
              >
                <summary className="cursor-pointer font-medium text-slate-900">{item.q}</summary>
                <p className="mt-2 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
