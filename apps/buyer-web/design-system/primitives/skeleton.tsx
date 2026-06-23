import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const roundedMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };
  return (
    <div
      className={cn(
        'animate-pulse bg-neutral-200',
        roundedMap[rounded],
        className,
      )}
      aria-hidden="true"
    />
  );
}
