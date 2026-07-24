'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Panel as SharedPanel } from '@/design-system/primitives';

/**
 * Titled header for the captain sub-pages (COD, shifts, KYC, fleet, …).
 *
 * Purely presentational: the session guard, the page `<main>`, and the bottom
 * nav all live in `app/(rider)/layout.tsx` so they resolve once per navigation
 * rather than once per page.
 */
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
    <>
      <header className="sticky top-0 z-20 bg-rider-surface2 px-4 py-4 shadow-pop">
        <p className="text-xs font-semibold text-rider-accent">JebDekho Captain</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{title}</h1>
          <Link href="/notifications" className="rounded-full bg-white/10 p-2 text-rider-text">
            <Bell className="h-5 w-5" />
          </Link>
        </div>
        {subtitle && <p className="mt-1 text-sm text-rider-muted">{subtitle}</p>}
      </header>
      <section className="space-y-4 p-4">{children}</section>
    </>
  );
}

/** Re-exported for backwards compatibility with existing imports. */
export const Panel = SharedPanel;
