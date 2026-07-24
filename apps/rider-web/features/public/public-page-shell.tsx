import Link from 'next/link';
import type { ReactNode } from 'react';

const FOOTER_LINKS = [
  { href: '/about', label: 'Become a partner' },
  { href: '/help', label: 'Help' },
  { href: '/faq', label: 'FAQ' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/agreement', label: 'Partner agreement' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/data-deletion', label: 'Delete my data' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Chrome for the signed-out, publicly crawlable pages. Deliberately separate
 * from CaptainPageShell: these render without a session, so they must never
 * pull in the auth guard or the bottom nav.
 */
export function PublicPageShell({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rider-bg text-rider-text">
      <header className="border-b border-rider-border bg-rider-surface2">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/about" className="text-sm font-bold uppercase tracking-wide text-rider-accent">
            JebDekho Rider
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-rider-accent px-4 py-2 text-sm font-bold text-rider-accent-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <h1 className="text-2xl font-black md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-rider-muted md:text-base">{subtitle}</p>}
        {updated && <p className="mt-1 text-xs text-rider-muted">Last updated: {updated}</p>}
        <div className="mt-8 space-y-6">{children}</div>
      </main>

      <footer className="mt-8 border-t border-rider-border bg-rider-surface2">
        <div className="mx-auto w-full max-w-3xl px-5 py-8">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-rider-muted hover:text-rider-text">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-xs leading-relaxed text-rider-muted">
            JebDekho is owned and operated by UrbanMove Services Private Limited. Delivery partners
            are independent contractors, not employees.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** A titled prose block. Keeps every static page's rhythm identical. */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-rider-border bg-rider-surface p-5">
      <h2 className="text-base font-bold text-rider-text">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-rider-muted">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item.slice(0, 60)}>{item}</li>
      ))}
    </ul>
  );
}
