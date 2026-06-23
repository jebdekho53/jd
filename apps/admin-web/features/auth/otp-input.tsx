'use client';

import { useRef, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { cn } from '@/lib/cn';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, '').split('').slice(0, length);

  const update = (idx: number, char: string) => {
    const arr = [...digits];
    arr[idx] = char;
    onChange(arr.join('').replace(/\s/g, ''));
    if (char && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const onKey = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="tel"
          maxLength={1}
          value={d === ' ' ? '' : d}
          disabled={disabled}
          aria-label={`OTP digit ${i + 1}`}
          onChange={(e: ChangeEvent<HTMLInputElement>) => update(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-10 rounded-lg border text-center text-lg font-semibold outline-none',
            'focus:border-admin-500 focus:ring-2 focus:ring-admin-100',
            d && d !== ' ' ? 'border-admin-400 bg-admin-50' : 'border-slate-300',
            disabled && 'opacity-50',
          )}
        />
      ))}
    </div>
  );
}
