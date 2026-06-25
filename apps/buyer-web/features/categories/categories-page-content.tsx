'use client';

import { CategoryExplorer } from '@/components/discovery/category-explorer';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { SectionHeader } from '@/components/v2/section-header';
import { useCategories } from '@/hooks/use-buyer-queries';

export function CategoriesPageContent() {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-jd-text-primary">Categories</h1>
        <p className="mt-1 text-sm text-jd-text-muted">Browse groceries by aisle</p>
      </div>

      <SmartSearchSection />

      <section aria-labelledby="all-categories">
        <SectionHeader title="All categories" />
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream-3" />
            ))}
          </div>
        ) : (
          <CategoryExplorer categories={categories} />
        )}
      </section>
    </div>
  );
}
