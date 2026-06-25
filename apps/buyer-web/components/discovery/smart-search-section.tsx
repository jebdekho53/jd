'use client';

import { useRouter } from 'next/navigation';
import { Mic, Search, X } from 'lucide-react';
import { useSearchSuggestions, useTrendingSearches } from '@/hooks/use-buyer-queries';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useLocationStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

interface SmartSearchSectionProps {
  className?: string;
  autoFocus?: boolean;
  initialQuery?: string;
}

export function SmartSearchSection({
  className,
  autoFocus = false,
  initialQuery = '',
}: SmartSearchSectionProps) {
  const router = useRouter();
  const { lat, lng } = useLocationStore();
  const { items: recent, remove, clear } = useSearchHistory();
  const { data: trending } = useTrendingSearches('7d', lat ?? undefined, lng ?? undefined);
  const { data: suggestions } = useSearchSuggestions(initialQuery, lat ?? undefined, lng ?? undefined);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const trendingQueries =
    trending?.trending.map((t) => t.query) ??
    suggestions?.popularSearches ??
    ['milk', 'bread', 'eggs', 'snacks'];

  return (
    <section className={cn('rounded-2xl border border-border/50 bg-card p-4 shadow-card', className)} aria-labelledby="search-heading">
      <h2 id="search-heading" className="sr-only">
        Smart search
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          handleSubmit(String(fd.get('q') ?? ''));
        }}
        className="relative"
      >
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden />
        <input
          name="q"
          type="search"
          defaultValue={initialQuery}
          autoFocus={autoFocus}
          placeholder="Search products, stores, brands, categories…"
          className="h-12 w-full rounded-xl border border-border/60 bg-cream-1 pl-10 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label="Search"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-jd-text-muted transition hover:bg-cream-3 hover:text-primary"
          aria-label="Voice search (coming soon)"
          title="Voice search coming soon"
        >
          <Mic className="h-4 w-4" />
        </button>
      </form>

      {recent.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-jd-text-muted">Recent</p>
            <button type="button" onClick={clear} className="text-xs text-primary hover:underline">
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <span key={q} className="inline-flex items-center gap-1 rounded-full bg-cream-3 px-3 py-1 text-xs">
                <button type="button" onClick={() => handleSubmit(q)} className="font-medium text-jd-text-primary hover:text-primary">
                  {q}
                </button>
                <button type="button" onClick={() => remove(q)} aria-label={`Remove ${q}`}>
                  <X className="h-3 w-3 text-jd-text-muted" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-jd-text-muted">Trending near you</p>
        <div className="flex flex-wrap gap-2">
          {trendingQueries.slice(0, 10).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSubmit(q)}
              className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-jd-text-secondary transition hover:border-primary/30 hover:text-primary btn-press"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
