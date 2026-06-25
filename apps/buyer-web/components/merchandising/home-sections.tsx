import Link from 'next/link';
import { ArrowRight, CheckCircle2, Smartphone } from 'lucide-react';
import { TRUST_FEATURES } from '@/design-system/tokens';
import { cn } from '@/lib/utils';

export function HeroSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary px-6 py-10 text-white md:px-10 md:py-14',
        className,
      )}
      aria-labelledby="hero-heading"
    >
      <div className="relative z-10 max-w-lg">
        <p className="text-sm font-medium text-white/80">Check your pocket before buying</p>
        <h1 id="hero-heading" className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Compare Prices. Save More.
        </h1>
        <p className="mt-3 text-base text-white/90 md:text-lg">
          Find the best price from nearby stores. Local vendors, fast delivery, COD available.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/stores"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:bg-white/90 btn-press"
          >
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 btn-press"
          >
            Compare Products
          </Link>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
    </section>
  );
}

export function WhyJebDekhoSection({ className }: { className?: string }) {
  return (
    <section className={cn('', className)} aria-labelledby="why-heading">
      <h2 id="why-heading" className="mb-4 text-xl font-semibold text-jd-text-primary">
        Why JebDekho?
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TRUST_FEATURES.map((f) => (
          <div
            key={f.id}
            className="flex flex-col items-center rounded-2xl border border-border/50 bg-card p-4 text-center shadow-card card-hover"
          >
            <CheckCircle2 className="mb-2 h-6 w-6 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-jd-text-primary">{f.label}</p>
            <p className="mt-1 text-xs text-jd-text-muted">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LifestyleSection({ className }: { className?: string }) {
  return (
    <section className={cn('', className)} aria-labelledby="lifestyle-heading">
      <h2 id="lifestyle-heading" className="mb-4 text-xl font-semibold text-jd-text-primary">
        Shop by lifestyle
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { title: 'Healthy Living', href: '/search?collection=healthy-living', emoji: '🥗' },
          { title: 'Budget Shopping', href: '/search?collection=budget-shopping', emoji: '💰' },
          { title: 'Family Essentials', href: '/search?collection=family-essentials', emoji: '👨‍👩‍👧' },
          { title: 'Student Essentials', href: '/search?collection=student-essentials', emoji: '🎒' },
          { title: 'Quick Meals', href: '/search?collection=quick-meals', emoji: '⚡' },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col items-center rounded-2xl border border-border/50 bg-card p-4 text-center shadow-card card-hover"
          >
            <span className="text-2xl" aria-hidden>{item.emoji}</span>
            <p className="mt-2 text-sm font-semibold text-jd-text-primary">{item.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FreshProduceSection({ className }: { className?: string }) {
  const items = [
    { name: 'Fruits', href: '/categories/fruits', gradient: 'from-orange-50 to-amber-100/80' },
    { name: 'Vegetables', href: '/categories/vegetables', gradient: 'from-green-50 to-emerald-100/80' },
    { name: 'Dairy', href: '/categories/dairy', gradient: 'from-sky-50 to-blue-100/80' },
  ];

  return (
    <section className={cn('', className)} aria-labelledby="fresh-heading">
      <h2 id="fresh-heading" className="mb-4 text-xl font-semibold text-jd-text-primary">
        Fresh produce
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex h-28 items-end rounded-2xl bg-gradient-to-br p-5 shadow-card card-hover',
              item.gradient,
            )}
          >
            <span className="text-lg font-bold text-jd-text-primary">{item.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AppPromoSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-primary/30 bg-cream-2 p-8 text-center md:flex-row md:text-left',
        className,
      )}
      aria-labelledby="app-heading"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 md:mb-0 md:mr-6">
        <Smartphone className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <div className="flex-1">
        <h2 id="app-heading" className="text-lg font-semibold text-jd-text-primary">
          JebDekho mobile app — Coming soon
        </h2>
        <p className="mt-1 text-sm text-jd-text-muted">
          Faster checkout, live order tracking, and exclusive app-only deals.
        </p>
      </div>
      <span className="mt-4 rounded-full bg-accent/20 px-4 py-2 text-sm font-semibold text-jd-text-primary md:mt-0">
        Notify me
      </span>
    </section>
  );
}
