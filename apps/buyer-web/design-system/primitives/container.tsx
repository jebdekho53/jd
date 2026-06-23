import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg' | 'full';

const sizeClasses: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  full: 'max-w-6xl',
};

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: Size;
}

export function Container({ size = 'md', className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4', sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
}
