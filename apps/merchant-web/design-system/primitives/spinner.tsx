import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';

const S: Record<Size, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export function Spinner({ size = 'md', className }: { size?: Size; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        S[size],
        className,
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
