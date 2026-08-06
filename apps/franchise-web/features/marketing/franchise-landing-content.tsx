import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bike,
  CheckCircle2,
  ClipboardCheck,
  Handshake,
  LayoutDashboard,
  Link2,
  LifeBuoy,
  MapPinned,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: MapPinned,
    title: 'Own an exclusive territory',
    body: 'Enable exclusivity on your pincodes and every merchant there is yours — no other partner can claim a store inside it.',
  },
  {
    icon: Link2,
    title: 'Recruit with your own referral link',
    body: 'Share your unique link. Any store that signs up through it is permanently attributed to you, first-touch — for life.',
  },
  {
    icon: Wallet,
    title: 'Earn on every order',
    body: 'You earn a share of platform commission on all orders from the stores you bring on, paid out every 30-day settlement cycle.',
  },
  {
    icon: LayoutDashboard,
    title: 'A real operating dashboard',
    body: 'Track GMV, recruited stores, territory conflicts, and rider coverage in one place — not a spreadsheet someone emails you.',
  },
  {
    icon: BarChart3,
    title: 'Growth tools built in',
    body: 'See where your recruitment funnel drops off and which pincodes are worth expanding into next.',
  },
  {
    icon: LifeBuoy,
    title: 'Dedicated partner support',
    body: 'Raise a ticket straight from your dashboard for payouts, territory disputes, or KYC — routed to the right team automatically.',
  },
];

const STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Apply',
    body: 'Tell us your city, the pincodes you want to cover, and your investment capacity. Takes two minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'Get verified',
    body: 'Our team reviews your application and KYC documents, and checks your requested territory for conflicts.',
  },
  {
    icon: Handshake,
    title: 'Recruit merchants',
    body: 'Once approved, you get a referral link and a dashboard. Share the link — every signup through it is tracked as yours.',
  },
  {
    icon: Wallet,
    title: 'Get paid',
    body: 'Earn a commission share on every order your recruited, active stores fulfil — settled every 30 days to your bank account.',
  },
];

const PORTAL_FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard', desc: 'GMV, recruited stores, and earnings at a glance' },
  { icon: BadgeCheck, label: 'Stores', desc: 'Every store you’ve recruited and its approval status' },
  { icon: MapPinned, label: 'Territory', desc: 'Your pincodes, exclusivity, and any conflicts to resolve' },
  { icon: Bike, label: 'Riders', desc: 'Delivery coverage across your territory' },
  { icon: BarChart3, label: 'Growth', desc: 'Recruitment funnel and where applicants drop off' },
  { icon: LifeBuoy, label: 'Support', desc: 'Ticketed help for payouts, KYC, and territory issues' },
];

const FAQ = [
  {
    q: 'How is my commission calculated?',
    a: 'Every 30-day settlement period, we sum the platform commission earned on orders from your linked, active stores, then pay you your commission share of that — minus 18% GST and TDS where applicable. Stores still pending review earn nothing until approved.',
  },
  {
    q: 'What happens if two partners want the same pincode?',
    a: 'A pincode is only exclusive if you’ve enabled exclusivity on that territory. If another active partner already holds an exclusive claim there, we flag a territory conflict for our team to resolve — you’ll see it on your Territory page.',
  },
  {
    q: 'Do I need a GST number to apply?',
    a: 'No. Registration is only required above ₹20 lakh turnover (₹10 lakh in special-category states) — we pay unregistered partners without GST. You can add a GSTIN later from the partner portal once you register.',
  },
  {
    q: 'How long does approval take?',
    a: 'Our team reviews applications and KYC documents as they come in. You’ll be notified by email and SMS once a decision is made.',
  },
  {
    q: 'Do I get paid for stores that were already using JebDekho?',
    a: 'No — commission is referral-based. Only stores that sign up through your referral link, or that we manually attribute to you as your recruit, count toward your earnings. Being physically located in your territory alone doesn’t earn you anything.',
  },
];

export function FranchiseLandingContent() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-400/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
            JebDekho Franchise Program
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Build the marketplace in your city
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-slate-400">
            Own an exclusive territory, recruit local stores onto JebDekho with your own referral
            link, and earn a share of the commission on every order they fulfil.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-8 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300"
            >
              Apply for a franchise
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-6 py-3.5 font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              Already a partner? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-t border-slate-800/80 bg-slate-900/30 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Why partner with JebDekho</h2>
          <p className="mt-2 text-center text-slate-400">
            Everything you need to run a territory — recruitment, tracking, and payouts, in one dashboard.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-white">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-slate-950">
                  {i + 1}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTAL PREVIEW */}
      <section className="border-t border-slate-800/80 bg-slate-900/30 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">What you get in the partner portal</h2>
          <p className="mt-2 text-center text-slate-400">Not a lead form — a real dashboard for running your territory.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PORTAL_FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">{f.label}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-white">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  {item.q}
                </summary>
                <p className="mt-2 pl-6 text-sm leading-6 text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-slate-800/80 px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to build your territory?</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-400">
          Applications are reviewed by our team — takes two minutes to submit.
        </p>
        <Link
          href="/signup"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-8 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300"
        >
          Apply for a franchise
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </>
  );
}
