'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgePercent, Scale, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

const SLIDES: Slide[] = [
  {
    id: 'compare',
    eyebrow: 'Check your pocket before buying',
    title: 'Compare prices. Save more.',
    subtitle: 'Find the cheapest nearby seller across local stores.',
    cta: 'Compare now',
    href: '/compare',
    icon: Scale,
    className: 'from-primary to-secondary text-white',
  },
  {
    id: 'fast',
    eyebrow: 'Lightning fast',
    title: 'Delivery in minutes',
    subtitle: 'Groceries and essentials at your door, fast.',
    cta: 'Shop nearby',
    href: '/stores',
    icon: Truck,
    className: 'from-emerald-600 to-teal-700 text-white',
  },
  {
    id: 'deals',
    eyebrow: "Today's best",
    title: 'Deals & flash sales',
    subtitle: 'Limited-time offers from stores around you.',
    cta: 'View offers',
    href: '/offers',
    icon: BadgePercent,
    className: 'from-amber-500 to-orange-600 text-white',
  },
];

export function HeroCarousel({ className }: { className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = (index + SLIDES.length) % SLIDES.length;
    el.scrollTo({ left: el.clientWidth * clamped, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const id = setInterval(() => goTo(active + 1), 5000);
    return () => clearInterval(id);
  }, [active, goTo]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === index ? prev : index));
  };

  return (
    <section className={cn('relative', className)} aria-roledescription="carousel" aria-label="Promotions">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none"
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <Link
              key={slide.id}
              href={slide.href}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${slide.title}`}
              className={cn(
                'relative flex min-w-full snap-center flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-6 md:p-9',
                'min-h-[180px] md:min-h-[240px]',
                slide.className,
              )}
            >
              <div className="relative z-10 max-w-md">
                <p className="text-xs font-medium opacity-90 md:text-sm">{slide.eyebrow}</p>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight md:text-4xl">{slide.title}</h2>
                <p className="mt-2 text-sm opacity-95 md:text-base">{slide.subtitle}</p>
              </div>
              <span className="relative z-10 mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition group-hover:bg-white/25">
                {slide.cta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
              <Icon
                className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 opacity-15 md:h-52 md:w-52"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active === i}
            className={cn(
              'h-1.5 rounded-full transition-all',
              active === i ? 'w-6 bg-primary' : 'w-1.5 bg-border',
            )}
          />
        ))}
      </div>
    </section>
  );
}
