import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Search, Store } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 px-6 py-12 text-white md:px-10 md:py-16">
        <div className="relative z-10 max-w-xl">
          <p className="mb-2 text-sm font-medium text-emerald-100">Hyperlocal delivery</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Fresh from nearby stores, delivered fast
          </h1>
          <p className="mt-4 text-base text-emerald-50 md:text-lg">
            Discover approved stores near you. Browse products, compare prices, and get groceries
            delivered in minutes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="text-foreground">
              <Link href="/stores">
                Find stores nearby
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/search">
                <Search className="h-4 w-4" aria-hidden />
                Search products
              </Link>
            </Button>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: MapPin, title: 'Nearby stores', desc: 'Sorted by distance from your location' },
          { icon: Clock, title: 'Real-time availability', desc: 'Open/closed status based on store hours' },
          { icon: Store, title: 'Trusted merchants', desc: 'Only approved, active stores shown' },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}
