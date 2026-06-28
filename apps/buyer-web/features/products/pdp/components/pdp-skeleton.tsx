import { Skeleton } from '@/components/ui/skeleton';

export function PdpSkeleton() {
  return (
    <div className="animate-pulse space-y-6 pb-28 lg:pb-8">
      <div className="flex items-center gap-3 lg:hidden">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)_300px] lg:items-start lg:gap-8">
        <Skeleton className="aspect-square w-full rounded-2xl" />

        <div className="mt-4 space-y-4 lg:mt-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>

        <div className="hidden space-y-3 lg:block">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
