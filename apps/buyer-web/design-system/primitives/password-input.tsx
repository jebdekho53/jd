'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  /** Shows a required asterisk on the label. */
  required?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, required, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-neutral-800">
            {label}
            {required && (
              <span className="ml-0.5 text-red-600" aria-hidden>
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            type={visible ? 'text' : 'password'}
            className={cn(
              'flex h-11 w-full rounded-lg border bg-white px-4 pr-11 text-base text-neutral-900',
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
          <button
            type="button"
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-neutral-500 transition hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
PasswordInput.displayName = 'PasswordInput';
