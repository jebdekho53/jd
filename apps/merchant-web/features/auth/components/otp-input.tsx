'use client';

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

export function OtpInput({
  value,
  onChange,
  length = OTP_LENGTH,
  disabled = false,
  error,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const focusIndex = (i: number) => {
    refs.current[i]?.focus();
    refs.current[i]?.select();
  };

  const updateAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d === ' ' ? '' : d));
    onChange(next.join('').replace(/\s/g, '').slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) {
      updateAt(index, '');
      return;
    }
    updateAt(index, char);
    if (index < length - 1) focusIndex(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      focusIndex(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) focusIndex(index - 1);
    if (e.key === 'ArrowRight' && index < length - 1) focusIndex(index + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  useEffect(() => {
    if (value.length === 0) focusIndex(0);
  }, [value.length]);

  return (
    <div>
      <div
        className="flex justify-center gap-2"
        role="group"
        aria-label="One-time password"
      >
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digits[i]?.trim() ?? ''}
            disabled={disabled}
            aria-label={`OTP digit ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              'h-12 w-10 rounded-lg border text-center text-lg font-semibold text-slate-900',
              'transition-colors outline-none',
              'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
              error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white',
              digits[i]?.trim() && !error && 'border-brand-400 bg-brand-50',
              disabled && 'cursor-not-allowed opacity-50',
            )}
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
