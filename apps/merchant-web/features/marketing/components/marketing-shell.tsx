'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandLockup } from '@/components/brand/brand-lockup';
import { LogoLink } from '@/components/brand/logo';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLockup subtitle="Merchant" href="/" />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/features" className="text-slate-600 hover:text-brand-600">
              Features
            </Link>
            <Link href="/pricing" className="text-slate-600 hover:text-brand-600">
              Pricing
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-brand-600">
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
            >
              Start Selling
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-slate-200 bg-slate-900 py-10 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-8 px-4 text-sm">
          <div>
            <LogoLink href="/" size="md" className="mb-2" />
            <p className="font-semibold text-white">JebDekho Merchant</p>
            <p className="mt-2">Grow your business with hyperlocal commerce.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login">Merchant Login</Link>
          </div>
          <div className="flex flex-col gap-2">
            <a href="mailto:support@jebdekho.com">Support</a>
            <Link href="https://jebdekho.com/terms">Terms</Link>
            <Link href="https://jebdekho.com/privacy">Privacy</Link>
            <Link href="https://jebdekho.com/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
