import Link from 'next/link';
import Image from 'next/image';
import { Clock, Star, UtensilsCrossed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import type { RestaurantSummary } from '@/types/food';

interface RestaurantCardProps {
  restaurant: RestaurantSummary;
  variant?: 'default' | 'compact';
}

export function RestaurantCard({ restaurant, variant = 'default' }: RestaurantCardProps) {
  const cuisineLabel = restaurant.cuisines.slice(0, 2).map((c) => c.name).join(' · ');

  if (variant === 'compact') {
    return (
      <Link
        href={`/restaurant/${restaurant.slug}`}
        className="group block w-[260px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl sm:w-[280px]"
      >
        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card card-hover">
          <div className="relative h-28 bg-cream-3">
            {restaurant.bannerUrl ? (
              <Image src={restaurant.bannerUrl} alt="" fill className="object-cover" sizes="280px" loading="lazy" />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-bold text-primary/20">
                {restaurant.name.charAt(0)}
              </div>
            )}
            {restaurant.isCloudKitchen && (
              <Badge className="absolute left-2 top-2 text-[10px]">Cloud kitchen</Badge>
            )}
          </div>
          <div className="flex flex-1 flex-col p-3">
            <div className="flex items-start gap-2">
              {restaurant.logoUrl ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border">
                  <Image src={restaurant.logoUrl} alt="" fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {restaurant.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold group-hover:text-primary">{restaurant.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-jd-text-muted">{cuisineLabel}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-jd-text-muted">
                  <span className="inline-flex items-center gap-0.5 font-medium text-jd-text-primary">
                    <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                    {restaurant.ratingAvg.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Clock className="h-3 w-3" aria-hidden />
                    {restaurant.avgPrepTimeMins} min
                  </span>
                </div>
              </div>
            </div>
            {restaurant.costForTwo != null && (
              <p className="mt-auto pt-2 text-[10px] text-jd-text-muted">
                {formatCurrency(restaurant.costForTwo)} for two
              </p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={`/restaurant/${restaurant.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <article className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card card-hover">
        <div className="relative h-36 bg-cream-3 md:h-40">
          {restaurant.bannerUrl ? (
            <Image
              src={restaurant.bannerUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-cream-3 to-cream-4">
              <UtensilsCrossed className="h-10 w-10 text-primary/25" aria-hidden />
            </div>
          )}
          <span className="absolute bottom-3 right-3 rounded-lg bg-card/95 px-2 py-1 text-[10px] font-semibold text-primary shadow-card">
            {restaurant.avgPrepTimeMins} min
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {restaurant.logoUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border">
                <Image src={restaurant.logoUrl} alt="" fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold group-hover:text-primary">{restaurant.name}</h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-jd-text-muted">{cuisineLabel}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-jd-text-muted">
            <span className="inline-flex items-center gap-1 font-medium text-jd-text-primary">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
              {restaurant.ratingAvg.toFixed(1)} ({restaurant.ratingCount})
            </span>
            {restaurant.costForTwo != null && (
              <span>{formatCurrency(restaurant.costForTwo)} for two</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {restaurant.cuisines.slice(0, 3).map((c) => (
              <span
                key={c.id}
                className="rounded-md bg-cream-3 px-2 py-0.5 text-[10px] font-medium text-jd-text-secondary"
              >
                {c.name}
              </span>
            ))}
          </div>
          <span
            className={cn(
              'mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary py-2 text-sm font-semibold text-white transition group-hover:bg-secondary',
            )}
          >
            View menu
          </span>
        </div>
      </article>
    </Link>
  );
}
