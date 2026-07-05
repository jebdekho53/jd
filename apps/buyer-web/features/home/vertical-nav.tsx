'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVerticalsQuery } from '@/hooks/use-food-queries';

const FALLBACK_VERTICALS = [
  { label: 'Grocery', slug: 'grocery', href: '/' },
  { label: 'Food', slug: 'food', href: '/food' },
  { label: 'Bakery', slug: 'bakery', href: '/?vertical=bakery' },
  { label: 'Cafe', slug: 'cafe', href: '/?vertical=cafe' },
  { label: 'Fresh', slug: 'fresh', href: '/?vertical=fresh' },
  { label: 'Pet', slug: 'pet', href: '/?vertical=pet' },
];

function isVerticalActive(pathname: string, selectedVertical: string | null, slug: string, href: string): boolean {
  if (slug === 'food') {
    return (
      selectedVertical === 'food' ||
      pathname === '/food' ||
      pathname.startsWith('/restaurant') ||
      pathname.startsWith('/restaurants') ||
      pathname.startsWith('/cuisine') ||
      pathname.startsWith('/food/')
    );
  }
  if (slug === 'grocery') {
    return pathname === '/' && !selectedVertical;
  }
  if (pathname === '/' && selectedVertical === slug) return true;
  const base = href.split('?')[0];
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function VerticalNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedVertical = searchParams.get('vertical');
  const { data: verticals } = useVerticalsQuery();
  const tabs = verticals?.length
    ? verticals.map((v) => ({ label: v.label, slug: v.slug, href: v.href }))
    : FALLBACK_VERTICALS;

  return (
    <nav
      className={cn('overflow-x-auto scroll-smooth scrollbar-none', className)}
      aria-label="Shop by vertical"
    >
      <div className="flex gap-2 pb-1 snap-x snap-mandatory">
        {tabs.map((tab) => {
          const active = isVerticalActive(pathname, selectedVertical, tab.slug, tab.href);
          return (
            <Link
              key={tab.slug}
              href={tab.href}
              className={cn(
                'inline-flex min-h-10 shrink-0 snap-start items-center rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                active
                  ? 'bg-primary text-white shadow-card'
                  : 'border border-primary/20 bg-primary/10 text-primary shadow-card hover:border-primary/40 hover:bg-primary/15',
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
