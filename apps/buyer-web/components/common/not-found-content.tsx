'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Home, Store, Grid3X3 } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export function NotFoundContent() {
  const router = useRouter();

  return (
    <PageShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Logo size="lg" className="mb-6" />
        <p className="text-8xl font-bold text-primary/20" aria-hidden>
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-jd-text-primary">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-jd-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching or
          browse our stores.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push('/search')} className="gap-2">
            <Search className="h-4 w-4" aria-hidden />
            Search products
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden />
              Go home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/stores">
              <Store className="mr-2 h-4 w-4" aria-hidden />
              Browse stores
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/categories">
              <Grid3X3 className="mr-2 h-4 w-4" aria-hidden />
              Browse categories
            </Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
