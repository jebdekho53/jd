'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgePercent, Scale, Sparkles, Truck } from 'lucide-react';
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
    subtitle: 'Check nearby store prices before you buy daily essentials.',
    cta: 'Compare now',
    href: '/compare',
    icon: Scale,
    className: 'from-emerald-700 via-primary to-lime-500 text-white',
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
                'group relative flex min-w-full snap-center flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br p-5 shadow-elevated md:p-9',
                'min-h-[198px] md:min-h-[258px]',
                slide.className,
              )}
            >
              <div className="pointer-events-none absolute -right-8 top-5 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute bottom-5 right-5 hidden w-48 rounded-3xl border border-white/20 bg-white/12 p-3 text-white shadow-2xl backdrop-blur-sm sm:block">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
                  <span>Local price check</span>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-2xl bg-white/18 px-3 py-2 text-xs">
                    <span>Store A</span>
                    <span className="font-bold">₹142</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-xs text-primary">
                    <span>Best nearby</span>
                    <span className="font-bold">₹119</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 max-w-[17rem] sm:max-w-md">
                <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide opacity-95 md:text-xs">
                  {slide.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight md:text-4xl">{slide.title}</h2>
                <p className="mt-2 text-sm leading-5 opacity-95 md:text-base">{slide.subtitle}</p>
              </div>
              <span className="relative z-10 mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-card transition group-hover:translate-x-0.5 group-hover:bg-white/95">
                {slide.cta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
              <Icon
                className="pointer-events-none absolute -bottom-8 -right-5 h-44 w-44 opacity-15 md:h-56 md:w-56"
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
