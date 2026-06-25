'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Scale } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { CompareGroup } from '@/lib/compare-products';
import { SectionHeader } from '@/components/v2/section-header';

interface PriceCompareCardProps {
  group: CompareGroup;
  className?: string;
}

export function PriceCompareCard({ group, className }: PriceCompareCardProps) {
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <article
      className={cn(
        'flex w-[300px] shrink-0 flex-col rounded-2xl border border-primary/15 bg-card p-4 shadow-card card-hover sm:w-[320px]',
        className,
      )}
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-3">
          {group.imageUrl ? (
            <Image src={group.imageUrl} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold text-primary/30">
              {group.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-jd-text-primary">{group.name}</h3>
          <p className="text-xs text-jd-text-muted">{group.unit}</p>
          {group.savingsPercent > 0 && (
            <span className="mt-1 inline-flex rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-jd-text-primary">
              Save {group.savingsPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {group.offers.slice(0, 3).map((offer, i) => {
          const isBest = i === group.bestIndex;
          return (
            <div
              key={offer.storeId}
              className={cn(
                'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs',
                isBest ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-cream-2',
              )}
            >
              <span className="truncate font-medium text-jd-text-secondary">
                Store {labels[i]} · {offer.storeName}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className={cn('font-bold', isBest ? 'text-primary' : 'text-jd-text-primary')}>
                  {formatCurrency(offer.price)}
                </span>
                {isBest && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase">
                    Best
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href={`/compare?q=${encodeURIComponent(group.name)}`}
        className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-white transition hover:bg-secondary btn-press"
      >
        <Scale className="h-3.5 w-3.5" aria-hidden />
        Compare prices
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </article>
  );
}

interface PriceCompareZoneProps {
  groups: CompareGroup[];
  className?: string;
}

export function PriceCompareZone({ groups, className }: PriceCompareZoneProps) {
  if (groups.length === 0) return null;

  return (
    <section className={cn('rounded-2xl bg-cream-3 p-4 md:p-6', className)} aria-labelledby="compare-heading">
      <SectionHeader
        title="Compare prices across stores"
        subtitle="JebDekho finds the best deal near you"
        href="/compare"
        linkLabel="Start comparing"
      />
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
        {groups.map((g) => (
          <div key={g.key} className="snap-start">
            <PriceCompareCard group={g} />
          </div>
        ))}
      </div>
    </section>
  );
}
