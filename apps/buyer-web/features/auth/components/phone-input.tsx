'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '@/design-system/primitives/input';
import { formatPhoneDisplay } from '@/lib/phone';

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, error, disabled, ...props }, ref) => {
    const display = formatPhoneDisplay(value);

    return (
      <Input
        ref={ref}
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="98765 43210"
        hint="10-digit Indian mobile number"
        error={error}
        disabled={disabled}
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
          onChange(digits);
        }}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
