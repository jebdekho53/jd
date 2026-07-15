'use client';

import Link from 'next/link';
import { Bell, CircleUserRound, Headphones, Home, IndianRupee, ListChecks } from 'lucide-react';

const links = [
  ['Home', '/home', Home],
  ['Orders', '/orders', ListChecks],
  ['Earnings', '/earnings', IndianRupee],
  ['Support', '/support', Headphones],
  ['Account', '/account', CircleUserRound],
] as const;

export function CaptainPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-100 pb-24 text-slate-950">
      <header className="sticky top-0 z-20 bg-slate-950 px-4 py-4 text-white shadow-lg">
        <p className="text-xs font-medium text-emerald-300">JebDekho Captain</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{title}</h1>
          <Link href="/notifications" className="rounded-full bg-white/10 p-2 text-white">
            <Bell className="h-5 w-5" />
          </Link>
        </div>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </header>
      <section className="space-y-4 p-4">{children}</section>
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto grid max-w-md grid-cols-5 border-t border-slate-200 bg-white">
        {links.map(([label, href, Icon]) => (
          <Link key={href} href={href} className="grid h-16 place-items-center text-xs font-semibold text-slate-500">
            <span className="grid justify-items-center gap-1">
              <Icon className="h-5 w-5" />
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}
