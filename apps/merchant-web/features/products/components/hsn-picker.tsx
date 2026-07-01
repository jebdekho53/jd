'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input, Select } from '@/design-system/primitives';
import { merchantFetch } from '@/services/api/merchant-client';

export interface HsnOption {
  id: string;
  code: string;
  description: string;
  defaultGstSlab: string;
}

interface HsnPickerProps {
  value?: string;
  selectedOption?: HsnOption | null;
  onChange: (hsn: HsnOption | null) => void;
  error?: string;
  required?: boolean;
}

const SLAB_OPTIONS: { value: string; label: string }[] = [
  { value: 'ZERO', label: '0%' },
  { value: 'FIVE', label: '5%' },
  { value: 'TWELVE', label: '12%' },
  { value: 'EIGHTEEN', label: '18%' },
  { value: 'TWENTY_EIGHT', label: '28%' },
];

const HSN_CODE_REGEX = /^\d{4}(\d{2}){0,2}$/;

async function searchHsn(q: string): Promise<HsnOption[]> {
  const res = await merchantFetch<{ success: boolean; data: HsnOption[] }>(
    `/api/merchant/gst/hsn?q=${encodeURIComponent(q)}`,
  );
  return res.data;
}

// Register (or fetch) a merchant-entered HSN code so it can be linked to the
// product. The GST slab the merchant picks is what the product is taxed at.
async function ensureHsn(code: string, gstSlab: string): Promise<HsnOption> {
  const res = await merchantFetch<{ success: boolean; data: HsnOption }>('/api/merchant/gst/hsn', {
    method: 'POST',
    body: JSON.stringify({ code, gstSlab }),
  });
  return res.data;
}

export function HsnPicker({ value, selectedOption, onChange, error, required }: HsnPickerProps) {
  const [code, setCode] = useState('');
  const [slab, setSlab] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  // Guards against re-registering the same code/slab pair repeatedly.
  const resolvedKey = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedCode = code.trim();
  const codeValid = HSN_CODE_REGEX.test(normalizedCode);

  // Prefill from an existing selection (edit mode) whenever the target changes.
  useEffect(() => {
    if (selectedOption && selectedOption.id === value) {
      setCode(selectedOption.code);
      setSlab(selectedOption.defaultGstSlab);
      resolvedKey.current = `${selectedOption.code}|${selectedOption.defaultGstSlab}`;
      return;
    }
    if (!value) {
      setCode('');
      setSlab('');
      resolvedKey.current = null;
    }
    // Only react to identity of the target product's HSN, not local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedOption?.id]);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['merchant', 'hsn', normalizedCode],
    queryFn: () => searchHsn(normalizedCode),
    enabled: showSuggestions && normalizedCode.length >= 2,
  });

  // Resolve the entered code + slab into a real HSN reference id (debounced).
  useEffect(() => {
    const key = `${normalizedCode}|${slab}`;
    if (!codeValid || !slab) {
      resolvedKey.current = null;
      onChange(null);
      return;
    }
    if (resolvedKey.current === key) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResolving(true);
      setResolveError(null);
      ensureHsn(normalizedCode, slab)
        .then((row) => {
          resolvedKey.current = key;
          // Tax the product at the slab the merchant chose, not any shared default.
          onChange({ id: row.id, code: row.code, description: row.description, defaultGstSlab: slab });
        })
        .catch((err: unknown) => {
          resolvedKey.current = null;
          onChange(null);
          setResolveError(err instanceof Error ? err.message : 'Could not save HSN code');
        })
        .finally(() => setResolving(false));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCode, slab, codeValid]);

  const applySuggestion = (o: HsnOption) => {
    setCode(o.code);
    setSlab(o.defaultGstSlab);
    setShowSuggestions(false);
    resolvedKey.current = `${o.code}|${o.defaultGstSlab}`;
    onChange(o);
  };

  const codeError =
    error ?? resolveError ?? (normalizedCode && !codeValid ? 'Enter a 4, 6, or 8 digit numeric HSN code' : undefined);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
        <div className="relative">
          <Input
            label={required ? 'HSN code *' : 'HSN code'}
            placeholder="e.g. 04011000"
            inputMode="numeric"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/[^\d]/g, ''));
              setShowSuggestions(true);
              setResolveError(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            error={codeError}
          />
          {showSuggestions && options.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-lg">
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-slate-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(o);
                    }}
                  >
                    <span className="font-mono font-semibold">{o.code}</span>
                    <span className="ml-2 text-slate-600">{o.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Select
          label="GST %"
          value={slab}
          onChange={(e) => {
            setSlab(e.target.value);
            setResolveError(null);
          }}
        >
          <option value="">Select</option>
          {SLAB_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-slate-500">
        Enter your product&apos;s HSN code and its GST rate — required for GST compliance and shipping labels.
      </p>
      {(isFetching || resolving) && (
        <p className="text-xs text-slate-500">{resolving ? 'Saving HSN code…' : 'Searching HSN codes…'}</p>
      )}
    </div>
  );
}
