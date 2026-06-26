'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ImageOff, Package, Store, Tags } from 'lucide-react';
import { fetchMediaCoverage } from '@/services/admin-api';
import { Badge, Button } from '@/design-system';

export function ImageCoverageContent() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'media', 'coverage'],
    queryFn: fetchMediaCoverage,
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading image coverage report…</p>;
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Failed to load coverage report.{' '}
        <button type="button" className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const { totals, samples } = data;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Grandfathered records without images remain visible to buyers. Use this report to prioritize
        backfill. New creates and updates require images per catalog policy.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Package} label="Products missing images" value={totals.productsWithoutImages} />
        <MetricCard icon={Store} label="Stores missing logo" value={totals.storesWithoutLogo} />
        <MetricCard icon={ImageOff} label="Stores missing banner" value={totals.storesWithoutBanner} />
        <MetricCard icon={Tags} label="Categories missing images" value={totals.categoriesWithoutImages} />
      </div>

      <CoverageSection
        title="Products without images"
        emptyLabel="All products have at least one image."
        items={samples.products.map((p) => ({
          id: p.id,
          primary: p.name,
          secondary: p.store.name,
          badge: p.isActive ? 'Active' : 'Inactive',
          badgeTone: p.isActive ? 'success' : 'neutral',
        }))}
      />

      <CoverageSection
        title="Stores missing logo"
        emptyLabel="All stores have a logo."
        items={samples.storesMissingLogo.map((s) => ({
          id: s.id,
          primary: s.name,
          secondary: s.status,
          badge: s.status,
          badgeTone: 'warning',
        }))}
      />

      <CoverageSection
        title="Stores missing banner"
        emptyLabel="All stores have a banner."
        items={samples.storesMissingBanner.map((s) => ({
          id: s.id,
          primary: s.name,
          secondary: s.status,
          badge: s.status,
          badgeTone: 'warning',
        }))}
      />

      <CoverageSection
        title="Categories / subcategories missing images"
        emptyLabel="All global categories have images."
        items={samples.categories.map((c) => ({
          id: c.id,
          primary: c.name,
          secondary: c.parent ? `Sub of ${c.parent.name}` : 'Top-level category',
          badge: c.isActive ? 'Active' : 'Disabled',
          badgeTone: c.isActive ? 'success' : 'neutral',
        }))}
      />

      <div className="flex gap-3">
        <Link href="/catalog">
          <Button variant="outline">Back to catalog</Button>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CoverageSection({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: {
    id: string;
    primary: string;
    secondary: string;
    badge: string;
    badgeTone: 'success' | 'warning' | 'neutral';
  }[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.primary}</p>
                <p className="truncate text-xs text-slate-500">{item.secondary}</p>
              </div>
              <Badge tone={item.badgeTone}>{item.badge}</Badge>
            </li>
          ))}
        </ul>
      )}
      {items.length >= 200 && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          Showing first 200 records. Run a DB query for the full list.
        </p>
      )}
    </section>
  );
}
