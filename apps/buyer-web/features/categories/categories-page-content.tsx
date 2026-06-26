'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { CategoryExplorer, CategoryRail } from '@/components/discovery/category-explorer';
import { SectionHeader } from '@/components/v2/section-header';
import { useCategories } from '@/hooks/use-buyer-queries';
import { TRENDING_SEARCHES } from '@/design-system/tokens';
import { Chip } from '@/design-system/primitives';

export function CategoriesPageContent() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Categories</h1>
        <p className="mt-1 text-sm text-jd-text-muted">Browse groceries by aisle</p>
      </div>

      <Link
        href="/search"
        className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-sm text-jd-text-muted shadow-card transition hover:border-primary/30"
      >
        <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Search products, brands & stores…
      </Link>

      <section aria-labelledby="trending-cat">
        <SectionHeader title="Trending searches" />
        <div className="flex flex-wrap gap-2">
          {TRENDING_SEARCHES.map((q) => (
            <Chip key={q} size="sm" onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}>
              {q}
            </Chip>
          ))}
        </div>
      </section>

      <section aria-labelledby="quick-cat" className="md:hidden">
        <SectionHeader title="Quick browse" />
        <CategoryRail categories={categories} />
      </section>

      <section aria-labelledby="all-categories">
        <SectionHeader title="All categories" subtitle={!isLoading ? `${flattenCount(categories)} aisles` : undefined} />
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream-3" />
            ))}
          </div>
        ) : (
          <CategoryExplorer categories={categories} showAll />
        )}
      </section>
    </div>
  );
}

function flattenCount(categories: Parameters<typeof CategoryExplorer>[0]['categories']): number {
  if (!categories) return 0;
  let n = 0;
  const walk = (items: NonNullable<typeof categories>) => {
    for (const c of items) {
      n += 1;
      if (c.children?.length) walk(c.children);
    }
  };
  walk(categories);
  return n;
}
