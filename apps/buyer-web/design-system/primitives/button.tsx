import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-jd-primary text-white hover:bg-jd-secondary active:opacity-90 disabled:opacity-50',
  secondary:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 disabled:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-800 hover:bg-neutral-100 active:bg-neutral-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  outline:
    'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-11 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jd-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
