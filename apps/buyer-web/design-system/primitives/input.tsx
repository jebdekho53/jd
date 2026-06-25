import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-neutral-800">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-white px-4 text-base text-neutral-900',
            'placeholder:text-neutral-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60',
            error ? 'border-red-500' : 'border-neutral-200',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-2 text-xs text-neutral-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
