'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVerticalsQuery } from '@/hooks/use-food-queries';

const FALLBACK_VERTICALS = [
  { label: 'Grocery', slug: 'grocery', href: '/' },
  { label: 'Food', slug: 'food', href: '/food' },
  { label: 'Bakery', slug: 'bakery', href: '/?vertical=bakery' },
  { label: 'Cafe', slug: 'cafe', href: '/?vertical=cafe' },
  { label: 'Fresh', slug: 'fresh', href: '/?vertical=fresh' },
];

function isVerticalActive(pathname: string, slug: string, href: string): boolean {
  if (slug === 'food') {
    return (
      pathname === '/food' ||
      pathname.startsWith('/restaurant') ||
      pathname.startsWith('/restaurants') ||
      pathname.startsWith('/cuisine') ||
      pathname.startsWith('/food/')
    );
  }
  if (slug === 'grocery') {
    return pathname === '/' && !pathname.startsWith('/food');
  }
  const base = href.split('?')[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function VerticalNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: verticals } = useVerticalsQuery();
  const tabs = verticals?.length
    ? verticals.map((v) => ({ label: v.label, slug: v.slug, href: v.href }))
    : FALLBACK_VERTICALS;

  return (
    <nav
      className={cn('overflow-x-auto scrollbar-none', className)}
      aria-label="Shop by vertical"
    >
      <div className="flex gap-2 pb-1">
        {tabs.map((tab) => {
          const active = isVerticalActive(pathname, tab.slug, tab.href);
          return (
            <Link
              key={tab.slug}
              href={tab.href}
              className={cn(
                'inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-medium transition',
                active
                  ? 'bg-primary text-white shadow-card'
                  : 'border border-border/60 bg-card text-jd-text-secondary hover:border-primary/30 hover:text-primary',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
