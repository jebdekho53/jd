import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  success: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  brand: 'bg-brand-500 text-white',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
