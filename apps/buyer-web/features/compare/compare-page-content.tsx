'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Scale, ArrowUpDown } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState, ErrorState } from '@/components/common/state-blocks';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { SmartSearchSection } from '@/components/discovery/smart-search-section';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import { useProductSearch } from '@/hooks/use-buyer-queries';
import { useDebounce } from '@/hooks/use-debounce';
import { buildCompareGroups } from '@/lib/compare-products';
import { formatCurrency, cn } from '@/lib/utils';
import type { CompareGroup } from '@/lib/compare-products';

type SortKey = 'price' | 'discount' | 'store';

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
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState<SortKey>('price');
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading, isError, error, refetch } = useProductSearch(
    { q: debouncedQuery.trim() || undefined, page: 1, limit: 60 },
    debouncedQuery.trim().length >= 2,
  );

  const groups = useMemo(
    () => sortGroups(buildCompareGroups(data?.data ?? [], 20), sort),
    [data, sort],
  );

  return (
    <PageShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-bold text-jd-text-primary">Price comparison</h1>
          </div>
          <p className="mt-1 text-sm text-jd-text-muted">
            Compare prices across nearby stores and find the best deal
          </p>
        </div>

        <SmartSearchSection initialQuery={query} autoFocus />

        {debouncedQuery.trim().length < 2 && (
          <EmptyState
            variant="search"
            title="Search to compare"
            description="Enter a product name (e.g. milk, rice, banana) to see prices from multiple stores."
          />
        )}

        {debouncedQuery.trim().length >= 2 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-jd-text-muted">Sort by:</span>
            {(
              [
                { key: 'price', label: 'Lowest price' },
                { key: 'discount', label: 'Highest discount' },
                { key: 'store', label: 'Store name' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSort(opt.key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition',
                  sort === opt.key ? 'bg-primary text-white' : 'bg-cream-3 text-jd-text-secondary',
                )}
              >
                <ArrowUpDown className="h-3 w-3" aria-hidden />
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {debouncedQuery.trim().length >= 2 && isLoading && <ProductGridSkeleton count={4} />}

        {debouncedQuery.trim().length >= 2 && isError && (
          <ErrorState
            message={error instanceof Error ? error.message : 'Comparison failed'}
            onRetry={() => refetch()}
          />
        )}

        {debouncedQuery.trim().length >= 2 && !isLoading && !isError && groups.length === 0 && (
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
                  className="rounded-2xl border border-border/50 bg-card p-4 shadow-card"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-3">
                      {group.imageUrl ? (
                        <Image src={group.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-primary/20">
                          {group.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-jd-text-primary">{group.name}</h2>
                      <p className="text-xs text-jd-text-muted">{group.unit}</p>
                      {group.savingsPercent > 0 && (
                        <p className="mt-1 text-sm font-semibold text-success">
                          Save up to {group.savingsPercent}% ({formatCurrency(group.savingsAmount)})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[320px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-jd-text-muted">
                          <th className="pb-2 pr-4">Store</th>
                          <th className="pb-2 pr-4">Price</th>
                          <th className="pb-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.offers.map((offer, i) => {
                          const isBest = i === group.bestIndex;
                          return (
                            <tr
                              key={offer.storeId}
                              className={cn('border-b border-border/30', isBest && 'bg-primary/5')}
                            >
                              <td className="py-3 pr-4">
                                <Link
                                  href={`/stores/${offer.storeSlug}`}
                                  className="font-medium text-jd-text-primary hover:text-primary"
                                >
                                  {offer.storeName}
                                </Link>
                                {isBest && (
                                  <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase">
                                    Best price
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-4 font-bold">{formatCurrency(offer.price)}</td>
                              <td className="py-3">
                                <AddToCartButton
                                  productId={offer.productId}
                                  variantId={offer.variantId}
                                  storeId={offer.storeId}
                                  storeName={offer.storeName}
                                  availableQty={99}
                                  compact
                                  className="h-8 text-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/products/${best?.productId}?store=${best?.storeSlug}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View product details
                    </Link>
                    <Link
                      href={`/search?q=${encodeURIComponent(group.name)}`}
                      className="text-xs text-jd-text-muted hover:text-primary"
                    >
                      See all results
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
