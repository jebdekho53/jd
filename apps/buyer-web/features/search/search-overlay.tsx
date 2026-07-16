'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Search, TrendingUp, X } from 'lucide-react';
import { fetchSearchSuggestions, fetchTrendingSearches } from '@/services/buyer/buyer-api';
import { useEffectiveLocation } from '@/store/location-store';

const RECENT_KEY = 'jd_recent_searches';
const MAX_RECENT = 8;

function loadRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string): string[] {
  const next = [q, ...loadRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * Blinkit/Zepto-style floating search: opens over the page (no navigation),
 * auto-focuses, shows recent + trending when empty and live product/category/
 * store suggestions as you type. Selecting a result navigates to it.
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { lat, lng } = useEffectiveLocation();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setDebounced('');
    setRecent(loadRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);

  const showSuggest = debounced.length >= 2;

  const suggestions = useQuery({
    queryKey: ['search-suggest', debounced, lat, lng],
    queryFn: () => fetchSearchSuggestions(debounced, lat, lng),
    enabled: open && showSuggest,
    staleTime: 30_000,
  });

  const trending = useQuery({
    queryKey: ['search-trending', lat, lng],
    queryFn: () => fetchTrendingSearches('7d', lat, lng),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const goQuery = (query: string) => {
    const term = query.trim();
    if (!term) return;
    setRecent(pushRecent(term));
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };
  const goto = (path: string) => {
    onClose();
    router.push(path);
  };
  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
    setRecent([]);
  };

  if (!open) return null;
  const s = suggestions.data;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* Search bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
        <button type="button" onClick={onClose} aria-label="Close search" className="rounded-full p-2 text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3"
          onSubmit={(e) => {
            e.preventDefault();
            goQuery(q);
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search milk, atta, snacks, fruits…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            enterKeyHint="search"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); inputRef.current?.focus(); }} aria-label="Clear" className="p-1 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {showSuggest ? (
          <div className="divide-y divide-slate-50">
            {suggestions.isLoading && <p className="px-4 py-6 text-sm text-slate-400">Searching…</p>}

            {s?.products?.length ? (
              <div className="py-2">
                {s.products.map((p) => (
                  <button key={p.id} onClick={() => goto(`/products/${p.id}`)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
                      {p.imageUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Search className="h-4 w-4 text-slate-300" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-800">{p.name}</span>
                      {p.brand && <span className="block truncate text-xs text-slate-400">{p.brand}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {s?.categories?.length ? (
              <div className="py-2">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Categories</p>
                {s.categories.map((c) => (
                  <button key={c.id} onClick={() => goto(`/search?categoryId=${c.id}`)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <Search className="h-4 w-4 shrink-0 text-slate-300" />
                    <span className="truncate text-sm text-slate-700">{c.name}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {s?.stores?.length ? (
              <div className="py-2">
                <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stores</p>
                {s.stores.map((st) => (
                  <button key={st.id} onClick={() => goto(`/store/${st.slug}`)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100">
                      {st.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={st.logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="truncate text-sm text-slate-700">{st.name}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {s?.popularSearches?.length ? (
              <div className="py-2">
                {s.popularSearches.map((term) => (
                  <button key={term} onClick={() => goQuery(term)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                    <Search className="h-4 w-4 shrink-0 text-slate-300" />
                    <span className="truncate text-sm text-slate-600">{term}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!suggestions.isLoading && s && !s.products?.length && !s.categories?.length && !s.stores?.length && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-slate-500">No matches for “{debounced}”.</p>
                <button onClick={() => goQuery(debounced)} className="mt-2 text-sm font-semibold text-primary">
                  Search anyway
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 px-4 py-4">
            {recent.length > 0 && (
              <section>
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent</h3>
                  <button onClick={clearRecent} className="text-xs font-medium text-slate-400 hover:text-slate-600">Clear</button>
                </div>
                <div className="flex flex-col">
                  {recent.map((term) => (
                    <button key={term} onClick={() => goQuery(term)} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-sm text-slate-700">{term}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {trending.data?.trending?.length ? (
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Trending
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trending.data.trending.map((t) => (
                    <button
                      key={t.query}
                      onClick={() => goQuery(t.query)}
                      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-primary hover:text-primary"
                    >
                      {t.query}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {recent.length === 0 && !trending.data?.trending?.length && (
              <p className="py-16 text-center text-sm text-slate-400">Start typing to search products, brands, and stores near you.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
