'use client';

import { SectionHeader } from '@/components/v2/section-header';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { ProductCardSkeleton } from '@/components/common/skeletons';
import { ProductCard } from '@/features/products/product-card';
import { useRecommendedProducts } from '@/hooks/use-recommendations';

interface RecommendationsRailProps {
  lat: number;
  lng: number;
  pincode?: string;
}

/** Personalized picks driven by real browsing/purchase affinity — see
 *  useRecommendedProducts. Renders nothing for guests or once it's clear
 *  there's nothing to show, matching the other home rails' pattern. */
export function RecommendationsRail({ lat, lng, pincode }: RecommendationsRailProps) {
  const { data, isLoading, isError } = useRecommendedProducts(lat, lng, pincode);
  const products = data ?? [];

  if (isError) return null;
  if (!isLoading && products.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Recommended for you" subtitle="Picked from what you browse and buy" />
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[152px] shrink-0 sm:w-[168px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <HorizontalCarousel label="Recommended for you" itemClassName="w-[152px] sm:w-[168px]">
          {products.map((product) => (
            <ProductCard
              key={`recommended-${product.id}-${product.store.id}`}
              product={product}
              variant="carousel"
              showStore
              trackView
            />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
}
