'use client';

import { ProductCard } from '@/features/products/product-card';
import { HorizontalCarousel } from '@/components/v2/horizontal-carousel';
import { SectionHeader } from '@/components/v2/section-header';
import type { BuyerProductWithStore } from '@/types/buyer';

interface PdpSimilarSectionProps {
  similar: BuyerProductWithStore[];
  sameBrand: BuyerProductWithStore[];
  brand?: string | null;
}

export function PdpSimilarSection({ similar, sameBrand, brand }: PdpSimilarSectionProps) {
  const fbt = similar.slice(0, 6);
  const recommended = similar.slice(0, 8);

  return (
    <div className="space-y-8">
      {sameBrand.length > 0 && brand && (
        <section aria-labelledby="pdp-brand-heading">
          <SectionHeader title={`More from ${brand}`} href={`/brand/${brand.toLowerCase().replace(/\s+/g, '-')}`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sameBrand.map((p) => (
              <ProductCard key={`${p.id}-${p.store.id}`} product={p} showStore trackView />
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="pdp-similar-heading">
          <SectionHeader title="Similar products" href="/products" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {similar.map((p) => (
              <ProductCard
                key={`${p.id}-${p.store.id}`}
                product={p}
                showStore
                trackView
                rating={p.store.ratingAvg}
              />
            ))}
          </div>
        </section>
      )}

      {fbt.length > 0 && (
        <section aria-labelledby="pdp-fbt-heading">
          <SectionHeader title="Frequently bought together" />
          <HorizontalCarousel label="Frequently bought together" itemClassName="w-[152px] sm:w-[168px]">
            {fbt.map((p) => (
              <ProductCard key={`fbt-${p.id}-${p.store.id}`} product={p} variant="carousel" showStore />
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {recommended.length > 0 && (
        <section aria-labelledby="pdp-rec-heading">
          <SectionHeader title="Recommended for you" href="/products" />
          <HorizontalCarousel label="Recommended products" itemClassName="w-[152px] sm:w-[168px]">
            {recommended.map((p) => (
              <ProductCard
                key={`rec-${p.id}-${p.store.id}`}
                product={p}
                variant="carousel"
                showStore
                trackView
              />
            ))}
          </HorizontalCarousel>
        </section>
      )}
    </div>
  );
}
