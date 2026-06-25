import { cn } from '@/lib/utils';

export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-4', className)} aria-hidden>
      <div className="h-36 rounded-3xl bg-cream-3" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-cream-3" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-cream-3" />
        ))}
      </div>
    </div>
  );
}

export function ProfileListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-cream-3" />
      ))}
    </div>
  );
}
