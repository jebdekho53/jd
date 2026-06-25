import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryBadgeProps {
  minutes: number;
  className?: string;
}

export function DeliveryBadge({ minutes, className }: DeliveryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary',
        className,
      )}
    >
      <Clock className="h-3 w-3" aria-hidden />
      <span>{minutes} min</span>
    </span>
  );
}
