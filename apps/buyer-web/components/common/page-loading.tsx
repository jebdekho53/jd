import { PageShell } from '@/components/layout/site-shell';
import { ProductGridSkeleton } from '@/components/common/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

interface PageLoadingProps {
  variant?: 'default' | 'grid' | 'detail';
}

export function PageLoading({ variant = 'default' }: PageLoadingProps) {
  return (
    <PageShell>
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        {variant === 'detail' ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : variant === 'grid' ? (
          <ProductGridSkeleton />
        ) : (
          <Skeleton className="h-40 w-full rounded-2xl" />
        )}
      </div>
    </PageShell>
  );
}
