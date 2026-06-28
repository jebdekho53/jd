'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/design-system/primitives';
import { cn } from '@/lib/utils';
import type { StockStatus } from '../utils';

interface PdpGalleryProps {
  images: string[];
  name: string;
  discountPct?: number;
  stockStatus: StockStatus;
}

export function PdpGallery({ images, name, discountPct = 0, stockStatus }: PdpGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
    setActive(i);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === i ? prev : i));
  };

  if (!hasImages) {
    return (
      <div className="relative grid aspect-square place-items-center rounded-2xl bg-cream-3 text-6xl font-bold text-primary/20 lg:rounded-3xl">
        {name.charAt(0)}
        {stockStatus === 'out_of_stock' && (
          <Badge tone="danger" className="absolute left-3 top-3">
            Out of stock
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-cream-3 lg:rounded-3xl">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none"
        >
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={url}
                alt={`${name} — image ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {discountPct > 0 && (
          <Badge tone="brand" className="absolute left-3 top-3 shadow-sm">
            {discountPct}% OFF
          </Badge>
        )}
        {stockStatus === 'out_of_stock' && (
          <Badge tone="danger" className="absolute right-3 top-3">
            Out of stock
          </Badge>
        )}
        {stockStatus === 'low_stock' && (
          <Badge tone="warning" className="absolute right-3 top-3">
            Low stock
          </Badge>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((url, i) => (
              <button
                key={`dot-${url}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Image ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  active === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="hidden gap-2 overflow-x-auto scrollbar-none lg:flex">
          {images.map((url, i) => (
            <button
              key={`thumb-${url}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition',
                active === i ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
