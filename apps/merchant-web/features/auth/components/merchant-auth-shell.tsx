'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Store, TrendingUp, Truck, Wallet } from 'lucide-react';
import { BrandLockup } from '@/components/brand/brand-lockup';
import { LogoLink } from '@/components/brand/logo';

const BENEFITS = [
  { icon: Store, label: 'List products in minutes' },
  { icon: Truck, label: 'Hyperlocal delivery network' },
  { icon: Wallet, label: 'Fast settlements & payouts' },
  { icon: TrendingUp, label: 'Growth tools & analytics' },
] as const;

interface MerchantAuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function MerchantAuthShell({ title, subtitle, children, footer }: MerchantAuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <aside className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 px-10 py-12 text-white lg:flex">
          <div>
            <BrandLockup subtitle="Merchant" href="/" inverted className="mb-0 gap-3" />
            <p className="mt-6 max-w-sm text-lg text-brand-100">
              Sell to customers near you. Manage orders, inventory, and payouts from one dashboard.
            </p>
            <ul className="mt-10 space-y-5">
              {BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-base">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-brand-200/80">
            Questions?{' '}
            <a href="mailto:support@jebdekho.com" className="underline hover:text-white">
              support@jebdekho.com
            </a>
          </p>
        </aside>

        <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <LogoLink href="/" size="lg" priority />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
              </div>
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
