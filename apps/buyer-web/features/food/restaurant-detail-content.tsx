'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgePercent,
  Clock,
  MapPin,
  Plus,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { ErrorState } from '@/components/common/state-blocks';
import { SectionHeader } from '@/components/v2/section-header';
import { useToast } from '@/design-system/primitives';
import { useRestaurantMenuQuery, useRestaurantQuery } from '@/hooks/use-food-queries';
import {
  useAddFoodCartItemMutation,
  useFoodCartQuery,
} from '@/hooks/use-food-cart';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types/food';
import { SessionError } from '@/services/auth/auth-api';

function DietBadge({ dietType }: { dietType: string }) {
  const isVeg = dietType === 'VEG';
  const isEgg = dietType === 'EGG';
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border',
        isVeg ? 'border-success' : isEgg ? 'border-amber-500' : 'border-destructive',
      )}
      title={isVeg ? 'Vegetarian' : isEgg ? 'Contains egg' : 'Non-vegetarian'}
      aria-hidden
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isVeg ? 'bg-success' : isEgg ? 'bg-amber-500' : 'bg-destructive',
        )}
      />
    </span>
  );
}

function parsePrice(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function getItemPrice(item: MenuItem): number {
  const defaultVariant = item.variants.find((v) => v.isDefault) ?? item.variants[0];
  if (defaultVariant) return parsePrice(defaultVariant.price);
  return parsePrice(item.basePrice);
}

function MenuItemRow({
  item,
  restaurantSlug,
  onAdded,
}: {
  item: MenuItem;
  restaurantSlug: string;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const addItem = useAddFoodCartItemMutation();
  const unavailable = item.availability !== 'AVAILABLE';
  const price = getItemPrice(item);
  const images = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const defaultVariant = item.variants.find((v) => v.isDefault) ?? item.variants[0];

  const handleAdd = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/restaurant/${restaurantSlug}`)}`);
      return;
    }
    try {
      await addItem.mutateAsync({
        menuItemId: item.id,
        variantId: defaultVariant?.id,
        quantity: 1,
      });
      toast(`Added ${item.name}`, 'success');
      onAdded();
    } catch (err) {
      const message = err instanceof SessionError ? err.message : 'Could not add item';
      toast(message, 'error');
    }
  };

  return (
    <li className="flex gap-3 border-b border-border/60 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <DietBadge dietType={item.dietType} />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-jd-text-primary">{item.name}</h4>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-jd-text-muted">{item.description}</p>
            )}
            {defaultVariant && item.variants.length > 1 && (
              <p className="mt-1 text-[11px] text-jd-text-muted">{defaultVariant.name}</p>
            )}
            <p className="mt-2 text-sm font-semibold text-jd-text-primary">{formatCurrency(price)}</p>
          </div>
        </div>
      </div>
      {images[0] && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-3">
          <Image src={images[0]} alt="" fill className="object-cover" sizes="80px" />
        </div>
      )}
      <div className="flex shrink-0 flex-col items-end justify-end">
        <button
          type="button"
          onClick={handleAdd}
          disabled={unavailable || addItem.isPending}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg border-2 border-primary px-3 py-1.5 text-xs font-bold text-primary transition',
            unavailable
              ? 'cursor-not-allowed opacity-40'
              : 'hover:bg-primary hover:text-white btn-press',
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          ADD
        </button>
        {unavailable && (
          <span className="mt-1 text-[10px] text-destructive">Unavailable</span>
        )}
      </div>
    </li>
  );
}

export function RestaurantDetailContent({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: restaurant, isLoading, isError, error, refetch } = useRestaurantQuery(slug);
  const { data: menuData, isLoading: menuLoading } = useRestaurantMenuQuery(slug);
  const { data: foodCart } = useFoodCartQuery();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = menuData?.categories ?? [];
  const visibleCategory = activeCategory ?? categories[0]?.id ?? null;

  const cartCount = foodCart?.store.slug === slug ? foodCart.itemCount : 0;
  const cartTotal = foodCart?.store.slug === slug ? foodCart.totals.grandTotal : 0;

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    document.getElementById(`menu-cat-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const reviewItems = useMemo(() => restaurant?.reviews ?? [], [restaurant?.reviews]);

  if (isError) {
    return (
      <PageShell>
        <ErrorState
          message={error instanceof Error ? error.message : 'Restaurant not found'}
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  if (isLoading || !restaurant) {
    return (
      <PageShell hideFloatingCart>
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-3xl bg-muted" />
          <div className="h-8 w-2/3 rounded-lg bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
      </PageShell>
    );
  }

  const cuisineNames = restaurant.cuisines.map((c) => c.name).join(' · ');

  return (
    <PageShell hideFloatingCart className="max-w-4xl">
      <div className="space-y-6 pb-24">
        <nav className="text-sm text-jd-text-muted">
          <Link href="/food" className="hover:text-primary">Food</Link>
          <span className="mx-2">/</span>
          <span className="text-jd-text-primary">{restaurant.name}</span>
        </nav>

        <div className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-card">
          <div className="relative h-44 md:h-56">
            {restaurant.bannerUrl ? (
              <Image
                src={restaurant.bannerUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-cream-3 to-primary/10">
                <UtensilsCrossed className="h-16 w-16 text-primary/30" aria-hidden />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 text-white">
              {restaurant.logoUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white/80">
                  <Image src={restaurant.logoUrl} alt="" fill className="object-cover" sizes="56px" />
                </div>
              ) : null}
              <div className="min-w-0">
                <h1 className="text-xl font-bold md:text-2xl">{restaurant.name}</h1>
                <p className="mt-0.5 text-sm text-white/90">{cuisineNames}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl bg-cream-3 px-3 py-2">
              <p className="text-[10px] font-medium uppercase text-jd-text-muted">Rating</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
                <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
                {restaurant.ratingAvg.toFixed(1)} ({restaurant.ratingCount})
              </p>
            </div>
            <div className="rounded-xl bg-cream-3 px-3 py-2">
              <p className="text-[10px] font-medium uppercase text-jd-text-muted">Delivery ETA</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" aria-hidden />
                {restaurant.avgPrepTimeMins} min
              </p>
            </div>
            <div className="rounded-xl bg-cream-3 px-3 py-2">
              <p className="text-[10px] font-medium uppercase text-jd-text-muted">Min order</p>
              <p className="mt-0.5 text-sm font-semibold">{formatCurrency(restaurant.minOrderAmount)}</p>
            </div>
            {restaurant.costForTwo != null && (
              <div className="rounded-xl bg-cream-3 px-3 py-2">
                <p className="text-[10px] font-medium uppercase text-jd-text-muted">Cost for two</p>
                <p className="mt-0.5 text-sm font-semibold">{formatCurrency(restaurant.costForTwo)}</p>
              </div>
            )}
          </div>

          {restaurant.description && (
            <p className="border-t border-border/50 px-4 py-3 text-sm text-jd-text-secondary">
              {restaurant.description}
            </p>
          )}

          <p className="flex items-center gap-1 border-t border-border/50 px-4 py-2 text-xs text-jd-text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {[restaurant.line1, restaurant.locality, restaurant.pincode].filter(Boolean).join(', ')}
          </p>
        </div>

        <section className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-jd-text-primary">
            <BadgePercent className="h-4 w-4 text-accent" aria-hidden />
            Offers & deals
          </div>
          <p className="mt-1 text-sm text-jd-text-muted">
            Restaurant promotions and bank offers appear here at checkout. No offer applied yet.
          </p>
        </section>

        <section aria-labelledby="restaurant-menu">
          <SectionHeader title="Menu" subtitle="Add items to your food cart" />

          {menuLoading ? (
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
          ) : categories.length === 0 ? (
            <p className="text-sm text-jd-text-muted">Menu is not available right now.</p>
          ) : (
            <>
              <div className="sticky top-[4.5rem] z-20 -mx-1 mb-4 flex gap-2 overflow-x-auto bg-background/95 px-1 py-2 scrollbar-none backdrop-blur-sm">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => scrollToCategory(cat.id)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition',
                      visibleCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-cream-3 text-jd-text-secondary hover:bg-cream-4',
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="space-y-8">
                {categories.map((cat) => (
                  <div key={cat.id} id={`menu-cat-${cat.id}`} className="scroll-mt-36">
                    <h3 className="mb-2 text-base font-semibold text-jd-text-primary">{cat.name}</h3>
                    {cat.description && (
                      <p className="mb-3 text-xs text-jd-text-muted">{cat.description}</p>
                    )}
                    <ul className="rounded-2xl border border-border/50 bg-card px-4">
                      {cat.items.map((item) => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          restaurantSlug={slug}
                          onAdded={() => {}}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {reviewItems.length > 0 && (
          <section aria-labelledby="restaurant-reviews">
            <SectionHeader title="Reviews" subtitle={`${restaurant.ratingCount} ratings`} />
            <ul className="space-y-3">
              {reviewItems.map((review) => (
                <li
                  key={review.id}
                  className="rounded-2xl border border-border/50 bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-cream-3 px-2 py-0.5 text-xs font-semibold">
                      <Star className="h-3 w-3 fill-accent text-accent" aria-hidden />
                      {review.rating}
                    </span>
                    {review.buyerName && (
                      <span className="text-xs font-medium text-jd-text-secondary">{review.buyerName}</span>
                    )}
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-jd-text-secondary">{review.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-lg md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
          <button
            type="button"
            onClick={() => router.push('/food/cart')}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-4 py-3 text-white shadow-float transition hover:bg-secondary btn-press"
          >
            <span className="text-sm font-semibold">
              {cartCount} item{cartCount !== 1 ? 's' : ''} · {formatCurrency(cartTotal)}
            </span>
            <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold">View cart</span>
          </button>
        </div>
      )}
    </PageShell>
  );
}
