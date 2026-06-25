'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: '1',
    title: 'Groceries in minutes',
    subtitle: 'Order from trusted stores near you',
    cta: 'Shop now',
    href: '/stores',
    gradient: 'from-brand-500 to-brand-700',
  },
  {
    id: '2',
    title: 'Best deals today',
    subtitle: 'Save on everyday essentials',
    cta: 'View deals',
    href: '/offers',
    gradient: 'from-brand-600 to-brand-700',
  },
  {
    id: '3',
    title: 'Fresh & local',
    subtitle: 'Discover top-rated neighbourhood stores',
    cta: 'Explore stores',
    href: '/stores',
    gradient: 'from-brand-500 to-brand-600',
  },
];

interface HeroBannerProps {
  slides?: HeroSlide[];
  className?: string;
}

export function HeroBanner({ slides = DEFAULT_SLIDES, className }: HeroBannerProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className={cn('relative', className)} aria-label="Promotional banners" aria-roledescription="carousel">
      <div className="relative overflow-hidden rounded-2xl">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            aria-hidden={index !== active}
            className={cn(
              'bg-gradient-to-br px-5 py-8 text-white transition-opacity duration-500 md:px-8 md:py-10',
              slide.gradient,
              index === active ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0',
            )}
          >
            <div className="relative z-10 max-w-md">
              <p className="text-sm font-medium text-white/80">Jebdekho</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{slide.title}</h2>
              <p className="mt-2 text-sm text-white/90 md:text-base">{slide.subtitle}</p>
              <Link
                href={slide.href}
                className="mt-5 inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-white/90"
                tabIndex={index === active ? 0 : -1}
              >
                {slide.cta}
              </Link>
            </div>
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Banner slides">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            onClick={() => setActive(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              index === active ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
            )}
          />
        ))}
      </div>
    </section>
  );
}
