'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  HelpCircle,
  LifeBuoy,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Search,
  ShieldCheck,
  Store,
  Truck,
  UserCircle,
} from 'lucide-react';
import { FAQ_ITEMS, HELP_SECTIONS } from '@/content/help-content';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { cn } from '@/lib/utils';

const QUICK_HELP = [
  {
    title: 'Orders',
    description: 'Track orders, cancel eligible orders, and check order status.',
    href: '/orders',
    icon: PackageCheck,
  },
  {
    title: 'Payments',
    description: 'Help with UPI, cards, net banking, COD, and failed payments.',
    href: '/faq',
    icon: CreditCard,
  },
  {
    title: 'Refunds & Returns',
    description: 'Understand refund timelines, replacements, and missing items.',
    href: '/refund-policy',
    icon: RefreshCcw,
  },
  {
    title: 'Delivery',
    description: 'Check delivery areas, charges, address changes, and delays.',
    href: '/faq',
    icon: Truck,
  },
  {
    title: 'Account',
    description: 'Login, profile, saved addresses, and account-related support.',
    href: '/profile',
    icon: UserCircle,
  },
  {
    title: 'Merchant Support',
    description: 'Store onboarding, product listing, verification, and seller help.',
    href: '/contact',
    icon: Store,
  },
] as const;

export function HelpPageContent() {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return FAQ_ITEMS.filter((item) => {
      const matchSection = !section || item.category === section;
      const matchQuery =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q);

      return matchSection && matchQuery;
    });
  }, [query, section]);

  return (
    <StaticPageLayout
      title="Help Center"
      subtitle="Find support for orders, payments, delivery, refunds, account issues, and merchant enquiries."
    >
      <p>
        Welcome to the JebDekho Help Center. Search for common questions,
        browse support topics, or contact our team for help with your order,
        payment, delivery, refund, or account.
      </p>

      <div className="relative not-prose mt-8">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jd-text-muted"
          aria-hidden
        />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help topics, orders, refunds, payments…"
          className="h-12 w-full rounded-xl border border-border/60 bg-cream-1 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label="Search help articles"
        />
      </div>

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_HELP.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-border/50 bg-card p-5 shadow-card transition hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>

                <div>
                  <h2 className="mt-0 text-base font-semibold text-jd-text-primary">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-jd-text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-12">Browse Help Topics</h2>

      <div className="not-prose mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection(null)}
          className={cn(
            'rounded-full px-4 py-2 text-xs font-semibold transition',
            !section
              ? 'bg-primary text-white'
              : 'bg-cream-3 text-jd-text-secondary hover:bg-muted',
          )}
        >
          All Topics
        </button>

        {HELP_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-semibold transition',
              section === s.id
                ? 'bg-primary text-white'
                : 'bg-cream-3 text-jd-text-secondary hover:bg-muted',
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="not-prose mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 text-sm text-jd-text-muted">
            No help articles match your search. Try a different keyword or
            contact our support team.
          </div>
        ) : (
          filtered.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border/50 bg-card p-5 shadow-card transition-all open:border-primary/40 open:bg-primary/5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-jd-text-primary marker:content-none">
                <span>{item.q}</span>
                <span className="shrink-0 text-xl leading-none text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>

              <p className="mt-3 text-sm leading-7 text-jd-text-muted">
                {item.a}
              </p>
            </details>
          ))
        )}
      </div>

      <section className="not-prose mt-10 rounded-2xl border border-border/50 bg-muted/30 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <LifeBuoy className="h-5 w-5" aria-hidden />
          </div>

          <div>
            <h2 className="mt-0 text-lg font-semibold text-jd-text-primary">
              Still Need Help?
            </h2>

            <p className="mt-2 text-sm leading-6 text-jd-text-muted">
              Our support team can help with order issues, payment failures,
              refunds, missing items, damaged products, delivery delays,
              account problems, and merchant enquiries.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary"
              >
                Contact Support
              </Link>

              <Link
                href="/faq"
                className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-jd-text-primary transition hover:bg-muted"
              >
                View FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-base font-semibold text-jd-text-primary">
            Safe Support
          </h3>
          <p className="mt-2 text-sm leading-6 text-jd-text-muted">
            We never ask for your password, full card number, or banking PIN.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
          <MapPin className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-base font-semibold text-jd-text-primary">
            Local Assistance
          </h3>
          <p className="mt-2 text-sm leading-6 text-jd-text-muted">
            We coordinate with nearby merchants for faster issue resolution.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-card">
          <HelpCircle className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="mt-3 text-base font-semibold text-jd-text-primary">
            Quick Answers
          </h3>
          <p className="mt-2 text-sm leading-6 text-jd-text-muted">
            Search FAQs anytime for common order, payment, and delivery queries.
          </p>
        </div>
      </div>
    </StaticPageLayout>
  );
}