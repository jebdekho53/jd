'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import { cn } from '@/lib/cn';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function OtpInput({ value, onChange, disabled, error }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  const focusIndex = (i: number) => {
    inputsRef.current[i]?.focus();
    inputsRef.current[i]?.select();
  };

  const updateAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d === ' ' ? '' : d));
    onChange(next.join('').replace(/\s/g, '').slice(0, OTP_LENGTH));
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) {
      updateAt(index, '');
      return;
    }
    updateAt(index, char);
    if (index < OTP_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      focusIndex(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) focusIndex(index - 1);
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) focusIndex(index + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(pasted);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  useEffect(() => {
    if (value.length === 0) focusIndex(0);
  }, [value.length]);

  return (
    <div>
      <div className="flex justify-center gap-2" role="group" aria-label="One-time password">
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            value={digits[i]?.trim() ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-12 w-10 rounded-lg border bg-white text-center text-lg font-semibold text-neutral-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              error ? 'border-red-500' : 'border-neutral-200',
              disabled && 'opacity-50',
            )}
            aria-invalid={error ? true : undefined}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
