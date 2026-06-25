import { cn } from '@/lib/cn';
import { SLA_COLORS, type SlaLevel } from '@/lib/order-pipeline';

interface Props {
  label: string;
  mins: number | null | undefined;
  level: SlaLevel;
}

export function OrderSlaBadge({ label, mins, level }: Props) {
  if (mins == null) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        SLA_COLORS[level],
      )}
    >
      {label}: {mins}m
    </span>
  );
}
