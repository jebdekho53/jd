'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle,
  Clock,
  Handshake,
  HelpCircle,
  Mail,
  MessageSquare,
  Store,
  Users,
} from 'lucide-react';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { Button } from '@/design-system/primitives';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SUPPORT_OPTIONS = [
  {
    title: 'Customer Support',
    description: 'For orders, delivery, payments, refunds, returns, and account help.',
    icon: HelpCircle,
    email: 'support@jebdekho.com',
  },
  {
    title: 'Merchant Support',
    description: 'For store onboarding, product listing, orders, payouts, and seller help.',
    icon: Store,
    email: 'merchant@jebdekho.com',
  },
  {
    title: 'Business Enquiries',
    description: 'For partnerships, collaborations, integrations, and business proposals.',
    icon: Briefcase,
    email: 'business@jebdekho.com',
  },
  {
    title: 'Partnerships',
    description: 'For delivery, brand, marketing, franchise, and strategic partnerships.',
    icon: Handshake,
    email: 'partners@jebdekho.com',
  },
] as const;

export function ContactPageContent() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <StaticPageLayout
      title="Contact Us"
      subtitle="We are here to help customers, merchants, and business partners."
    >
      <p>
        Need help with JebDekho? Contact our support team for order issues,
        delivery updates, payments, refunds, merchant onboarding, business
        enquiries, or general questions.
      </p>

      <p>
        JebDekho is owned and operated by{' '}
        <strong>UrbanMove Services Private Limited</strong>.
      </p>

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        {SUPPORT_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <div
              key={option.title}
              className="rounded-2xl border border-border/50 bg-card p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>

                <div>
                  <h2 className="mt-0 text-base font-semibold text-jd-text-primary">
                    {option.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-jd-text-muted">
                    {option.description}
                  </p>

                  <a
                    href={`mailto:${option.email}`}
                    className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                  >
                    {option.email}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-12">Send Us a Message</h2>

      {submitted ? (
        <div className="not-prose flex flex-col items-center rounded-2xl border border-success/20 bg-success/5 px-6 py-10 text-center">
          <CheckCircle className="h-12 w-12 text-success" aria-hidden />

          <p className="mt-4 text-lg font-semibold text-jd-text-primary">
            Message received!
          </p>

          <p className="mt-2 max-w-sm text-sm text-jd-text-muted">
            We&apos;ll get back to you as soon as possible at the email you
            provided.
          </p>

          <Link
            href="/help"
            className="mt-6 inline-flex min-h-touch items-center text-sm font-semibold text-primary hover:underline"
          >
            Browse help articles
          </Link>
        </div>
      ) : (
        <form
          className="not-prose space-y-5 rounded-2xl border border-border/50 bg-card p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-jd-text-primary"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                required
                className="mt-2 h-11 rounded-xl"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-jd-text-primary"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 h-11 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="text-sm font-medium text-jd-text-primary"
            >
              Subject
            </label>
            <Input
              id="subject"
              name="subject"
              required
              className="mt-2 h-11 rounded-xl"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="text-sm font-medium text-jd-text-primary"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className={cn(
                'mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            />
          </div>

          <Button type="submit" className="min-h-touch w-full sm:w-auto">
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
            Send Message
          </Button>

          <p className="flex items-center gap-2 text-xs text-jd-text-muted">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Or email us at{' '}
            <a
              href="mailto:support@jebdekho.com"
              className="font-medium text-primary hover:underline"
            >
              support@jebdekho.com
            </a>
          </p>
        </form>
      )}

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
          <div className="flex items-center gap-2 font-semibold text-jd-text-primary">
            <Clock className="h-5 w-5 text-primary" aria-hidden />
            Working Hours
          </div>

          <p className="mt-2 text-sm leading-6 text-jd-text-muted">
            Monday to Saturday, 10:00 AM to 7:00 PM IST. Support availability
            may vary on public holidays.
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-muted/30 p-5">
          <div className="flex items-center gap-2 font-semibold text-jd-text-primary">
            <Users className="h-5 w-5 text-primary" aria-hidden />
            Response Time
          </div>

          <p className="mt-2 text-sm leading-6 text-jd-text-muted">
            We usually respond within 24 hours. Order-related issues are given
            priority based on urgency and order status.
          </p>
        </div>
      </div>

      <p className="not-prose mt-8 text-sm text-jd-text-muted">
        Looking for quick answers? Visit the{' '}
        <Link href="/help" className="font-semibold text-primary hover:underline">
          Help Center
        </Link>{' '}
        or read our{' '}
        <Link href="/faq" className="font-semibold text-primary hover:underline">
          FAQs
        </Link>
        .
      </p>
    </StaticPageLayout>
  );
}