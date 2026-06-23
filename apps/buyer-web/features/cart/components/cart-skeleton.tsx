import { Skeleton } from '@/design-system/primitives';

export function CartItemSkeleton() {
  return (
    <div className="flex gap-3 py-4">
      <Skeleton className="h-16 w-16 shrink-0" rounded="lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="mt-auto flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="divide-y divide-neutral-100">
      {[1, 2, 3].map((i) => (
        <CartItemSkeleton key={i} />
      ))}
    </div>
  );
}
