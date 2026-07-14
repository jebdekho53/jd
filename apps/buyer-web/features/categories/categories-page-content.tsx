'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Grid3X3, Search, ShoppingBasket, Sparkles } from 'lucide-react';
import { CategoryRail } from '@/components/discovery/category-explorer';
import { SectionHeader } from '@/components/v2/section-header';
import { useCategories } from '@/hooks/use-buyer-queries';
import { TRENDING_SEARCHES } from '@/design-system/tokens';
import { Chip } from '@/design-system/primitives';
import { cn } from '@/lib/utils';
import { resolveCategoryImage } from '@/lib/category-images';
import type { CategoryItem } from '@/types/buyer';

export function CategoriesPageContent() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const [query, setQuery] = useState('');
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const isSearching = query.trim().length > 0;
  // Default view shows root departments only (true hierarchy); search flattens across
  // every level so any subcategory is still findable by name.
  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return categories;
    return flatCategories.filter((category) =>
      `${category.name} ${category.slug}`.toLowerCase().includes(normalized),
    );
  }, [categories, flatCategories, query]);

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-lime-50 p-5 shadow-card md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary shadow-card">
              Grocery aisles
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-jd-text-primary md:text-4xl">
              Shop faster by category
            </h1>
            <p className="mt-2 text-sm leading-6 text-jd-text-muted md:text-base">
              Browse fresh essentials, pantry staples, snacks, home care and daily needs from nearby stores.
            </p>
          </div>
          <div className="hidden h-24 w-24 shrink-0 place-items-center rounded-[2rem] bg-white text-primary shadow-elevated md:grid">
            <Grid3X3 className="h-10 w-10" aria-hidden />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card p-3 shadow-card">
        <label htmlFor="category-search" className="sr-only">
          Search categories
        </label>
        <div className="flex h-12 items-center gap-3 rounded-2xl bg-cream-2 px-4 text-sm">
          <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <input
            id="category-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories like dairy, snacks, atta…"
            className="min-w-0 flex-1 bg-transparent font-medium text-jd-text-primary outline-none placeholder:text-jd-text-muted"
          />
        </div>
      </div>

      <section aria-labelledby="trending-cat">
        <SectionHeader title="Trending searches" subtitle="Popular product searches right now" />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap">
          {TRENDING_SEARCHES.map((q) => (
            <Chip key={q} size="sm" onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}>
              {q}
            </Chip>
          ))}
        </div>
      </section>

      <section aria-labelledby="quick-cat">
        <SectionHeader title="Quick browse" />
        <CategoryRail categories={categories} className="-mx-4 px-4 md:mx-0 md:px-0" />
      </section>

      <section aria-labelledby="all-categories">
        <SectionHeader
          title={isSearching ? 'Matching categories' : 'All departments'}
          subtitle={
            !isLoading
              ? isSearching
                ? `${filteredCategories.length} matches`
                : `${filteredCategories.length} departments`
              : undefined
          }
        />
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-cream-3" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-primary shadow-card">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-bold text-jd-text-primary">No category found</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-jd-text-muted">
              Try a broader aisle name or search products directly.
            </p>
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
            >
              Search products
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <PremiumCategoryGrid categories={filteredCategories} showChildPreview={!isSearching} />
        )}
      </section>
    </div>
  );
}

function PremiumCategoryGrid({
  categories,
  showChildPreview = false,
}: {
  categories: CategoryItem[];
  showChildPreview?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6" role="list">
      {categories.map((category, index) => {
        const image = resolveCategoryImage(category);
        const childPreview =
          showChildPreview && category.children.length > 0
            ? category.children
                .slice(0, 3)
                .map((c) => c.name)
                .join(' · ') + (category.children.length > 3 ? ` +${category.children.length - 3}` : '')
            : null;
        return (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            role="listitem"
            className={cn(
              'group min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              index < 3 && 'bg-gradient-to-br from-white to-primary/5',
            )}
          >
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-3">
              {image ? (
                <Image
                  src={image}
                  alt={category.name}
                  fill
                  className="rounded-2xl object-contain p-3 transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 160px"
                />
              ) : (
                <div className="grid h-full place-items-center text-primary">
                  <ShoppingBasket className="h-7 w-7" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-h-[58px] p-2.5 text-center">
              <p className="line-clamp-2 text-[11px] font-black leading-tight text-jd-text-primary sm:text-xs">
                {category.name}
              </p>
              {childPreview && (
                <p className="mt-1 line-clamp-1 text-[10px] font-medium leading-tight text-jd-text-muted">
                  {childPreview}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  for (const category of categories) {
    result.push(category);
    if (category.children.length > 0) result.push(...flattenCategories(category.children));
  }
  return result;
}
