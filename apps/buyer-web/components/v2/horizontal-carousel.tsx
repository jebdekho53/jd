'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalCarouselProps {
  children: React.ReactNode;
  className?: string;
  label: string;
  itemClassName?: string;
}

export function HorizontalCarousel({
  children,
  className,
  label,
  itemClassName,
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
    setCanScrollLeft((prev) => (prev === left ? prev : left));
    setCanScrollRight((prev) => (prev === right ? prev : right));
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const childArray = Array.isArray(children) ? children : null;
  const childCount = childArray?.length ?? 0;

  useEffect(() => {
    updateScrollState();
  }, [childCount, updateScrollState]);

  return (
    <div className={cn('relative', className)}>
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition hover:bg-muted md:flex"
          aria-label={`Scroll ${label} left`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition hover:bg-muted md:flex"
          aria-label={`Scroll ${label} right`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory"
        role="list"
        aria-label={label}
      >
        {childArray
          ? childArray.map((child, i) => (
              <div
                key={i}
                role="listitem"
                className={cn('shrink-0 snap-start', itemClassName)}
              >
                {child}
              </div>
            ))
          : children}
      </div>
    </div>
  );
}
