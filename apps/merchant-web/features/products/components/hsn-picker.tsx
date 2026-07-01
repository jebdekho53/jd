'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/design-system/primitives';
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

async function searchHsn(q: string): Promise<HsnOption[]> {
  const res = await merchantFetch<{ success: boolean; data: HsnOption[] }>(
    `/api/merchant/gst/hsn?q=${encodeURIComponent(q)}`,
  );
  return res.data;
}

export function HsnPicker({ value, selectedOption, onChange, error, required }: HsnPickerProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HsnOption | null>(null);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['merchant', 'hsn', query],
    queryFn: () => searchHsn(query),
    enabled: query.trim().length >= 2,
  });

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selectedOption?.id === value) {
      setSelected(selectedOption);
      return;
    }
    if (selected?.id === value) return;
    searchHsn(value).then((rows) => {
      const match = rows.find((r) => r.id === value) ?? rows[0];
      if (match) setSelected(match);
    });
  }, [value, selected?.id, selectedOption]);

  return (
    <div className="space-y-2">
      <Input
        label={required ? 'HSN code *' : 'HSN code'}
        placeholder="Search by code or description"
        value={selected ? `${selected.code} — ${selected.description}` : query}
        onChange={(e) => {
          setSelected(null);
          onChange(null);
          setQuery(e.target.value);
        }}
        error={error}
      />
      <p className="text-xs text-slate-500">
        HSN code is required for GST compliance and shipping labels.
      </p>
      {isFetching && <p className="text-xs text-slate-500">Searching HSN codes…</p>}
      {!selected && options.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-sm">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  setSelected(o);
                  setQuery('');
                  onChange(o);
                }}
              >
                <span className="font-mono font-semibold">{o.code}</span>
                <span className="ml-2 text-slate-600">{o.description}</span>
                <span className="ml-2 text-xs text-slate-400">GST {o.defaultGstSlab}%</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <p className="text-xs text-emerald-700">
          GST slab preview: <strong>{selected.defaultGstSlab.replace('_', '%').replace('TWENTY_EIGHT', '28')}</strong>
        </p>
      )}
    </div>
  );
}
