import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption' | 'label';

const variants: Record<Variant, string> = {
  display: 'text-3xl font-bold tracking-tight text-neutral-900',
  h1: 'text-2xl font-bold tracking-tight text-neutral-900',
  h2: 'text-xl font-semibold text-neutral-900',
  h3: 'text-lg font-semibold text-neutral-900',
  body: 'text-base text-neutral-800',
  bodySm: 'text-sm text-neutral-600',
  caption: 'text-xs text-neutral-500',
  label: 'text-sm font-medium text-neutral-800',
};

type Element = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'label';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: Variant;
  as?: Element;
}

export function Text({ variant = 'body', as = 'p', className, children, ...props }: TextProps) {
  const Comp = as;
  return (
    <Comp className={cn(variants[variant], className)} {...props}>
      {children}
    </Comp>
  );
}
