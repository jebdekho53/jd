'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RefreshCw, WifiOff } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { useCachedCategoriesSnapshot } from '@/hooks/use-cached-categories';
import { useRecentStores } from '@/hooks/use-recent-stores';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { useSearchHistory } from '@/hooks/use-search-history';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export function OfflinePageContent() {
  const router = useRouter();
  const { items: products } = useRecentlyViewed();
  const { items: stores } = useRecentStores();
  const categories = useCachedCategoriesSnapshot();
  const { items: searches } = useSearchHistory();

  const retry = () => {
    if (navigator.onLine) router.refresh();
    else router.push('/');
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-lg space-y-8 py-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#16a34a]/15 to-[#16a34a]/5">
            <WifiOff className="h-10 w-10 text-[#16a34a]" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-jd-text-primary">No Internet</h1>
          <p className="mt-2 text-sm text-jd-text-muted">
            You&apos;re offline. Previously visited pages and cached items are still available.
          </p>
          <p className="mt-1 text-xs text-jd-text-muted">{BRAND_NAME} · {BRAND_TAGLINE}</p>
          <Button type="button" className="mt-6 gap-2" onClick={retry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>

        {searches.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-jd-text-primary">Recent searches</h2>
            <div className="flex flex-wrap gap-2">
              {searches.map((q) => (
                <Link
                  key={q}
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-jd-text-secondary hover:border-primary/40"
                >
                  {q}
                </Link>
              ))}
            </div>
          </section>
        )}

        {stores.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-jd-text-primary">Recently viewed stores</h2>
            <div className="space-y-2">
              {stores.map((s) => (
                <Link
                  key={s.id}
                  href={`/store/${s.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30"
                >
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt="" width={40} height={40} className="rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs font-bold text-primary">
                      {s.name.slice(0, 1)}
                    </div>
                  )}
                  <span className="font-medium text-jd-text-primary">{s.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-jd-text-primary">Recently viewed products</h2>
            <div className="space-y-2">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/30"
                >
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt="" width={40} height={40} className="rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-jd-text-muted">{formatCurrency(p.price)} · {p.unit}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {categories.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-jd-text-primary">Cached categories</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-jd-text-secondary hover:border-primary/30"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl border border-dashed border-border bg-cream-2 p-6 text-center text-xs text-jd-text-muted">
          Checkout, payments, and account pages require an internet connection.
        </div>
      </div>
    </PageShell>
  );
}
