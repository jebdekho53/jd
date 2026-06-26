'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scale, TrendingDown } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { Chip } from '@/design-system/primitives';
import { useProductSearch } from '@/hooks/use-buyer-queries';
import { useDebounce } from '@/hooks/use-debounce';
import { buildCompareGroups } from '@/lib/compare-products';
import { formatCurrency, cn } from '@/lib/utils';
import type { CompareGroup } from '@/lib/compare-products';

type SortKey = 'price' | 'discount' | 'store';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Lowest price' },
  { key: 'discount', label: 'Best discount' },
  { key: 'store', label: 'A–Z' },
];

function sortGroups(groups: CompareGroup[], sort: SortKey): CompareGroup[] {
  return [...groups].sort((a, b) => {
    const bestA = a.offers[a.bestIndex]?.price ?? 0;
    const bestB = b.offers[b.bestIndex]?.price ?? 0;
    if (sort === 'price') return bestA - bestB;
    if (sort === 'discount') return b.savingsPercent - a.savingsPercent;
    return a.name.localeCompare(b.name);
  });
}

export function ComparePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState<SortKey>('price');
  const debouncedQuery = useDebounce(query, 400);

  const qFromUrl = searchParams.get('q') ?? '';
  useEffect(() => {
    setQuery(qFromUrl);
  }, [qFromUrl]);

  const { data, isLoading, isError, error, refetch } = useProductSearch(
    { q: debouncedQuery.trim() || undefined, page: 1, limit: 60 },
    debouncedQuery.trim().length >= 2,
  );

  const groups = useMemo(
    () => sortGroups(buildCompareGroups(data?.data ?? [], 20), sort),
    [data, sort],
  );

  const canSearch = debouncedQuery.trim().length >= 2;

  return (
    <PageShell>
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-jd-text-primary md:text-2xl">Price comparison</h1>
              <p className="text-sm text-jd-text-muted">Find the cheapest nearby seller</p>
            </div>
          </div>
        </div>

        <SmartSearchSection
          value={query}
          onChange={setQuery}
          onSubmit={(q) => router.replace(`/compare?q=${encodeURIComponent(q)}`)}
          autoFocus
        />

        {!canSearch && (
          <EmptyState
            variant="search"
            title="Search to compare"
            description="Enter a product name (e.g. milk, rice, banana) to see prices from multiple stores."
          />
        )}

        {canSearch && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {SORT_OPTIONS.map((opt) => (
              <Chip key={opt.key} size="sm" active={sort === opt.key} onClick={() => setSort(opt.key)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        )}

        {canSearch && isLoading && <ProductGridSkeleton count={4} />}

        {canSearch && isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Comparison failed'}
            onRetry={() => refetch()}
          />
        )}

        {canSearch && !isLoading && !isError && groups.length === 0 && (
          <EmptyState
            variant="search"
            title="No comparisons found"
            description={`We couldn't find "${debouncedQuery}" at multiple stores nearby. Try another product.`}
          />
        )}

        {groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((group) => {
              const best = group.offers[group.bestIndex];
              return (
                <article
                  key={group.key}
                  className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
                >
                  <div className="flex gap-3 border-b border-border p-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-3">
                      {group.imageUrl ? (
                        <Image src={group.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl font-bold text-primary/20">
                          {group.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 font-semibold text-jd-text-primary">{group.name}</h2>
                      <p className="text-xs text-jd-text-muted">{group.unit}</p>
                      {group.savingsPercent > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-success">
                          <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                          Save up to {group.savingsPercent}% ({formatCurrency(group.savingsAmount)})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mobile + desktop: card list (no cramped table) */}
                  <div className="divide-y divide-border">
                    {group.offers.map((offer, i) => {
                      const isBest = i === group.bestIndex;
                      const save =
                        offer.mrp && offer.mrp > offer.price ? offer.mrp - offer.price : 0;
                      return (
                        <div
                          key={offer.storeId}
                          className={cn(
                            'flex items-center justify-between gap-3 px-4 py-3',
                            isBest && 'bg-success/5',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/stores/${offer.storeSlug}`}
                              className="line-clamp-1 text-sm font-semibold text-jd-text-primary hover:text-primary"
                            >
                              {offer.storeName}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-jd-text-primary">
                                {formatCurrency(offer.price)}
                              </span>
                              {offer.mrp && offer.mrp > offer.price && (
                                <span className="text-xs text-jd-text-muted line-through">
                                  {formatCurrency(offer.mrp)}
                                </span>
                              )}
                              {save > 0 && (
                                <span className="text-xs font-medium text-success">
                                  −{formatCurrency(save)}
                                </span>
                              )}
                              {isBest && (
                                <span className="rounded bg-success px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                  Best
                                </span>
                              )}
                            </div>
                          </div>
                          <AddToCartButton
                            productId={offer.productId}
                            variantId={offer.variantId}
                            storeId={offer.storeId}
                            storeName={offer.storeName}
                            availableQty={99}
                            compact
                            className="h-9 shrink-0 text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 border-t border-border bg-muted/30 px-4 py-2.5">
                    <Link
                      href={`/products/${best?.productId}?store=${best?.storeSlug}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View details
                    </Link>
                    <Link
                      href={`/search?q=${encodeURIComponent(group.name)}`}
                      className="text-xs text-jd-text-muted hover:text-primary"
                    >
                      All results
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
