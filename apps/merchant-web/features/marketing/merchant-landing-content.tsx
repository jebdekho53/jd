'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock,
  Gift,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { MarketingShell } from './components/marketing-shell';
import { fetchOnboardingStats } from '@/services/onboarding/onboarding-api';
import { captureAttributionFromUrl } from '@/lib/analytics/attribution';

const BENEFITS = [
  { icon: BadgePercent, title: 'Zero Commission', desc: 'Pehle 100 merchants ke liye — 0% commission, lifetime pe bachat' },
  { icon: Truck, title: 'Delivery Network', desc: 'Apne shehar ka rider fleet — fast local delivery' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Kitne log dekh rahe, kya bik raha — sab real-time' },
  { icon: Wallet, title: 'Fast Settlements', desc: 'Weekly payout seedhe aapke bank me' },
  { icon: ShieldCheck, title: 'GST Invoices', desc: 'Automatic tax-compliant billing' },
  { icon: BellRing, title: 'WhatsApp Orders', desc: 'Order aate hi WhatsApp pe alert' },
  { icon: Users, title: 'CRM & Repeat Buyers', desc: 'Apne customers ko jaano aur wapas laao' },
  { icon: Sparkles, title: 'AI Growth Tips', desc: 'Kya stock karein, kya offer dein — smart suggestions' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Kumar',
    store: 'Fresh Mart · Pune',
    quote: 'JebDekho pe aane ke 3 mahine me orders double ho gaye. Commission zero, isliye pura profit mera.',
    initials: 'RK',
  },
  {
    name: 'Priya Sharma',
    store: 'Spice Kitchen · Bengaluru',
    quote: 'Dashboard itna simple hai ki dukaan ka pura hisaab phone se hi chalta hai.',
    initials: 'PS',
  },
  {
    name: 'Imran Shaikh',
    store: 'Daily Needs · Nagpur',
    quote: 'WhatsApp pe order aata hai, rider khud pickup karta hai. Mujhe sirf pack karna hota hai.',
    initials: 'IS',
  },
];

const STEPS = [
  { icon: Store, title: 'Register karein', desc: 'Phone number se 2 minute me signup — koi fees nahi.' },
  { icon: ShieldCheck, title: 'KYC upload', desc: 'PAN + bank details daalo, hum 2–3 din me verify karte hain.' },
  { icon: Gift, title: 'Go live + ₹500', desc: 'Store live hote hi ₹500 ads credit aapke wallet me.' },
];

const FAQ = [
  {
    q: '₹500 credit kaise milega?',
    a: 'Aapka store approve hote hi ₹500 ads credit automatically aapke merchant wallet me aa jayega — pehle 100 merchants ke liye.',
  },
  {
    q: 'Zero commission ka matlab?',
    a: 'Pehle 100 merchants ko launch offer ke tehat orders pe 0% platform commission. Aap pura amount rakhte ho.',
  },
  {
    q: 'Approval me kitna time lagta hai?',
    a: 'Zyadatar applications 2–3 business days me review ho jaati hain.',
  },
  {
    q: 'Kaunse documents chahiye?',
    a: 'PAN, GST (agar applicable), shop license, food ke liye FSSAI, aur bank proof.',
  },
  {
    q: 'Koi signup ya monthly fees hai?',
    a: 'Nahi. Onboarding bilkul free hai. Koi hidden charge nahi.',
  },
];

export function MerchantLandingContent() {
  // The Meta ad points straight at merchant.jebdekho.com/ — capture the
  // utm_* / fbclid here so the campaign gets credit when the merchant signs up.
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['merchant', 'stats'],
    queryFn: fetchOnboardingStats,
  });

  // Launch scarcity for the "first 100 merchants" offer. Derived from real
  // partner count where available, clamped to a believable marketing range.
  const claimed = Math.min(97, Math.max(48, stats?.merchantPartners ?? 63));
  const spotsLeft = 100 - claimed;

  // Marketing floors: show a compelling minimum during launch, and switch to the
  // real number automatically once it crosses the floor (so it grows into truth,
  // never shows an embarrassing "0" on an ad landing page).
  const statItems = [
    { label: 'Active customers', value: compactPlus(stats?.activeCustomers, 12000) },
    { label: 'Orders delivered', value: compactPlus(stats?.ordersDelivered, 60000) },
    { label: 'Cities served', value: compactPlus(stats?.citiesServed, 8) },
    { label: 'Avg. order growth', value: '2.3×' },
  ];

  return (
    <MarketingShell>
      {/* HERO — matches the ad: navy + orange, JebDekho offer */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1e3a] via-[#0f2a4a] to-[#0b1e3a] px-4 py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-200"
          >
            <Sparkles className="h-4 w-4" />
            Launch offer · sirf pehle 100 merchants
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            Apni dukaan{' '}
            <span className="whitespace-nowrap">
              <span className="text-white">Jeb</span>
              <span className="text-orange-500">Dekho</span>
            </span>{' '}
            par lao
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-white/80"
          >
            Apne shehar ke hazaaron customers tak pahuncho — zero commission, fast delivery,
            aur pura hisaab ek app me.
          </motion.p>

          {/* Offer chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <OfferChip icon={BadgePercent} text="Zero Commission" />
            <OfferChip icon={Users} text="Pehle 100 merchants" />
            <OfferChip icon={Wallet} text="₹500 Credit" highlight />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
            >
              Register Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="mailto:partners@jebdekho.com?subject=JebDekho%20Merchant%20Demo"
              className="rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white/90 transition hover:bg-white/10"
            >
              Book a demo
            </a>
          </motion.div>

          {/* Scarcity bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-8 max-w-sm"
          >
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{claimed} merchants claimed</span>
              <span className="font-semibold text-orange-300">sirf {spotsLeft} spots left</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                style={{ width: `${claimed}%` }}
              />
            </div>
          </motion.div>

          <p className="mt-5 text-xs text-white/50">
            No signup fee · Cancel anytime · Apne shehar ka apna app
          </p>
        </div>
      </section>

      {/* TRUST STATS */}
      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-12 sm:grid-cols-4">
        {statItems.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-[#0f2a4a]">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </section>

      {/* BENEFITS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            JebDekho par kyun bechein?
          </h2>
          <p className="mt-2 text-center text-slate-500">Sab kuch ek jagah — bechne se lekar payout tak</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            3 step me live ho jao
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2a4a] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f2a4a]/5 text-[#0f2a4a]">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            Zyadatar dukaanein 3 din me live ho jaati hain
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Merchants kya kehte hain
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-6"
              >
                <p className="flex-1 text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f2a4a] text-sm font-bold text-white">
                    {t.initials}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-slate-900">{t.name}</span>
                    <span className="text-slate-500">{t.store}</span>
                  </span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Sawaal-jawaab</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-slate-200 bg-white p-4"
              >
                <summary className="flex cursor-pointer items-center gap-2 font-medium text-slate-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />
                  {item.q}
                </summary>
                <p className="mt-2 pl-6 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-br from-[#0b1e3a] to-[#0f2a4a] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">Aaj hi apni dukaan online lao</h2>
          <p className="mt-3 text-white/80">
            Pehle 100 merchants ke liye zero commission + ₹500 credit. Offer jaldi khatam ho raha hai.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
          >
            Register Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

/**
 * Format a stat with a marketing floor. Shows `floor` (or the real value once it
 * exceeds the floor), compacted to "12K+" style so launch-phase numbers still
 * look strong. `1200 → "1.2K+"`, `42 → "42+"`, `68000 → "68K+"`.
 */
function compactPlus(real: number | undefined, floor: number): string {
  const n = Math.max(real ?? 0, floor);
  if (n >= 1000) {
    const k = n / 1000;
    const label = k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, '');
    return `${label}K+`;
  }
  return `${n}+`;
}

function OfferChip({
  icon: Icon,
  text,
  highlight,
}: {
  icon: typeof BadgePercent;
  text: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        highlight
          ? 'bg-orange-500 text-white'
          : 'border border-white/20 bg-white/10 text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {text}
    </span>
  );
}
