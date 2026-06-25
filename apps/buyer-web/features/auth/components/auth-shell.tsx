'use client';

import type { ReactNode } from 'react';
import { Logo, LogoLink } from '@/components/brand/logo';
import { BRAND_TAGLINE } from '@/lib/brand';

const BENEFITS = [
  'Fast Delivery',
  'Secure Payments',
  'Rewards & Cashback',
  'Track Orders Live',
  'Exclusive Offers',
] as const;

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="s2-root min-h-screen bg-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <aside className="hidden flex-1 flex-col justify-center bg-gradient-to-br from-jd-primary to-jd-secondary px-10 py-16 text-white lg:flex">
          <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
            <Logo size="xl" priority />
          </div>
          <p className="mt-6 max-w-md text-lg text-white/90">{BRAND_TAGLINE}</p>
          <ul className="mt-10 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-base">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold"
                  aria-hidden
                >
                  ✓
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <LogoLink size="lg" priority />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
                <p className="mt-2 text-sm text-jd-text-muted">{subtitle}</p>
              </div>
              {children}
            </div>

            {footer && <div className="mt-6 text-center">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
