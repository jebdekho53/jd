import Link from 'next/link';
import Image from 'next/image';
import { Clock, MapPin, Star, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDistance, cn } from '@/lib/utils';
import type { StoreCard } from '@/types/buyer';

interface StoreCardProps {
  store: StoreCard;
  variant?: 'default' | 'compact' | 'featured';
  productCount?: number;
}

export function StoreCardItem({ store, variant = 'default', productCount }: StoreCardProps) {
  const categoryTags = ['Grocery', 'Local'];

  if (variant === 'compact') {
    return (
      <Link
        href={`/store/${store.slug}`}
        className="group block w-[280px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
      >
        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card card-hover">
          <div className="relative h-24 bg-cream-3">
            {store.bannerUrl ? (
              <Image src={store.bannerUrl} alt="" fill className="object-cover" sizes="280px" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-primary/20">
                {store.name.charAt(0)}
              </div>
            )}
            <Badge variant={store.isOpen ? 'success' : 'warning'} className="absolute right-2 top-2 text-[10px]">
              {store.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
          <div className="flex flex-1 flex-col p-3">
            <div className="flex items-start gap-2">
              {store.logoUrl ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border">
                  <Image src={store.logoUrl} alt="" fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {store.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold group-hover:text-primary">{store.name}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-jd-text-muted">
                  <span className="inline-flex items-center gap-0.5 font-medium text-jd-text-primary">
                    <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                    {store.ratingAvg.toFixed(1)}
                  </span>
                  <span>{formatDistance(store.distanceKm)}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Clock className="h-3 w-3" aria-hidden />
                    {store.avgPrepTimeMins} min
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-auto flex items-center justify-between pt-3 text-[10px] text-jd-text-muted">
              <span>Min {formatCurrency(store.minOrderAmount)}</span>
              <span className="font-semibold text-primary">View store →</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={`/store/${store.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <article
        className={cn(
          'overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card card-hover',
          variant === 'featured' && 'ring-2 ring-primary/15',
        )}
      >
        <div className="relative h-32 bg-cream-3 md:h-36">
          {store.bannerUrl ? (
            <Image src={store.bannerUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-cream-3 to-cream-4 text-3xl font-bold text-primary/20">
              {store.name.charAt(0)}
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant={store.isOpen ? 'success' : 'warning'}>
              {store.isOpen ? 'Open' : 'Closed'}
            </Badge>
            {variant === 'featured' && (
              <Badge className="bg-primary text-white">Top vendor</Badge>
            )}
          </div>
          <span className="absolute bottom-3 right-3 rounded-lg bg-card/95 px-2 py-1 text-[10px] font-semibold text-primary shadow-card">
            {store.avgPrepTimeMins} min delivery
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            {store.logoUrl && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border">
                <Image src={store.logoUrl} alt="" fill className="object-cover" sizes="48px" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold group-hover:text-primary">{store.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-jd-text-muted">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{store.address.line1}</span>
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoryTags.map((tag) => (
              <span key={tag} className="rounded-md bg-cream-3 px-2 py-0.5 text-[10px] font-medium text-jd-text-secondary">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-jd-text-muted sm:flex sm:flex-wrap sm:gap-3">
            <span className="inline-flex items-center gap-1 font-medium text-jd-text-primary">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
              {store.ratingAvg.toFixed(1)} ({store.ratingCount})
            </span>
            <span>{formatDistance(store.distanceKm)}</span>
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3 w-3" aria-hidden />
              {store.deliveryFee === 0 ? 'Free delivery' : formatCurrency(store.deliveryFee)}
            </span>
            <span>Min {formatCurrency(store.minOrderAmount)}</span>
            {productCount !== undefined && (
              <span className="col-span-2 sm:col-span-1">{productCount} products</span>
            )}
          </div>

          <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary py-2 text-sm font-semibold text-white transition group-hover:bg-secondary">
            View Store
          </span>
        </div>
      </article>
    </Link>
  );
}
