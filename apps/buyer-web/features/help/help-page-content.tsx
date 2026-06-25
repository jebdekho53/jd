'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { FAQ_ITEMS, HELP_SECTIONS } from '@/content/help-content';
import { StaticPageLayout } from '@/components/common/static-page-layout';
import { cn } from '@/lib/utils';

export function HelpPageContent() {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchSection = !section || item.category === section;
      const matchQuery =
        !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchSection && matchQuery;
    });
  }, [query, section]);

  return (
    <StaticPageLayout title="Help center" subtitle="Find answers to common questions">
      <div className="relative not-prose">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jd-text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="h-11 w-full rounded-xl border border-border/60 bg-cream-1 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label="Search help articles"
        />
      </div>

      <div className="not-prose mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection(null)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition',
            !section ? 'bg-primary text-white' : 'bg-cream-3 text-jd-text-secondary',
          )}
        >
          All topics
        </button>
        {HELP_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              section === s.id ? 'bg-primary text-white' : 'bg-cream-3 text-jd-text-secondary',
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="not-prose mt-8 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-jd-text-muted">No articles match your search.</p>
        ) : (
          filtered.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border/50 bg-card p-4 shadow-card"
            >
              <summary className="cursor-pointer list-none font-semibold text-jd-text-primary marker:content-none">
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-jd-text-muted">{item.a}</p>
            </details>
          ))
        )}
      </div>

      <div className="not-prose mt-8 rounded-2xl bg-cream-3 p-6">
        <h2 className="text-lg font-semibold text-jd-text-primary">Still need help?</h2>
        <p className="mt-1 text-sm text-jd-text-muted">
          Our support team is here to assist you with orders, payments, and delivery.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
        >
          Contact support
        </Link>
      </div>
    </StaticPageLayout>
  );
}
