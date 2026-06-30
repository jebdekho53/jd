import Link from 'next/link';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { FAQ_ITEMS } from '@/content/help-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Frequently Asked Questions | JebDekho',
  description:
    'Find answers to common questions about JebDekho orders, price comparison, nearby stores, delivery, COD, online payments, refunds, returns, cancellations, and customer support.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <StaticPageLayout
      title="Frequently Asked Questions"
      subtitle="Quick answers about shopping, delivery, payments, refunds, and support on JebDekho."
    >
      <p>
        Have questions about JebDekho? Here are answers to the most common
        questions about comparing prices, ordering from nearby stores, making
        payments, tracking deliveries, cancellations, refunds, and getting help.
      </p>

      <div className="not-prose mt-8 space-y-4">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-border/50 bg-card p-5 shadow-card transition-all open:border-primary/40 open:bg-primary/5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-jd-text-primary">
              <span>{item.q}</span>
              <span className="shrink-0 text-xl leading-none text-primary transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <p className="mt-4 text-sm leading-7 text-jd-text-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-border/50 bg-muted/30 p-6">
        <h2 className="mt-0">Need More Help?</h2>

        <p>
          Our support team can help you with order issues, delivery updates,
          refunds, payment failures, missing items, damaged products, account
          problems, merchant questions, and technical support.
        </p>

        <div className="not-prose mt-6 flex flex-wrap gap-4">
          <Link
            href="/help"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Visit Help Center
          </Link>

          <Link
            href="/contact"
            className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-jd-text-primary transition hover:bg-muted"
          >
            Contact Support
          </Link>

          <Link
            href="/track-order"
            className="rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-jd-text-primary transition hover:bg-muted"
          >
            Track Your Order
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border/50 bg-card p-6 shadow-card">
        <h3 className="text-lg font-semibold text-jd-text-primary">
          Still Have Questions?
        </h3>

        <p className="mt-2 text-sm leading-7 text-jd-text-muted">
          We regularly update our FAQs based on customer feedback. If your
          question is not answered here, please contact our support team and we
          will be happy to assist you.
        </p>
      </section>
    </StaticPageLayout>
  );
}