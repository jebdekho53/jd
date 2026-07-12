'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { NavItem } from './nav-items';

/**
 * Scores a nav item against the query. Higher is better; 0 means "no match".
 * Label matches beat keyword matches, and prefix matches beat mid-word ones,
 * so typing "deliv" surfaces "Delivery Coverage" ahead of pages that merely
 * list "delivery" as a keyword.
 */
function score(item: NavItem, query: string): number {
  const q = query.toLowerCase();
  const label = item.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (label.split(/[\s&]+/).some((word) => word.startsWith(q))) return 50;
  if (item.keywords?.split(/\s+/).some((word) => word.startsWith(q))) return 30;
  if (item.href.toLowerCase().includes(q)) return 20;
  return 0;
}

export function CommandPalette({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return items.slice(0, 8);
    return items
      .map((item) => ({ item, rank: score(item, q) }))
      .filter(({ rank }) => rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 10)
      .map(({ item }) => item);
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const onOpenKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onOpenKeyDown);
    return () => window.removeEventListener('keydown', onOpenKeyDown);
  }, [open, close]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
      >
        <Search className="h-4 w-4 flex-shrink-0" aria-hidden />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
          onClick={close}
          role="presentation"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search pages"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-4">
              <Search className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex((i) => (i + 1) % Math.max(results.length, 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1));
                  } else if (e.key === 'Enter' && results[activeIndex]) {
                    e.preventDefault();
                    go(results[activeIndex].href);
                  }
                }}
                placeholder="Jump to a page — try “orders”, “payouts”, “menu”"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                aria-label="Search pages"
              />
            </div>

            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                No page matches “{query}”.
              </p>
            ) : (
              <ul ref={listRef} className="max-h-80 overflow-y-auto p-2">
                {results.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go(item.href)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                          index === activeIndex ? 'bg-brand-50 text-brand-800' : 'text-slate-600',
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {index === activeIndex && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
