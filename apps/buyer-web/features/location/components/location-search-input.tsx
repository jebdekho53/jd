'use client';

import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input, Text } from '@/design-system/primitives';
import { useLocationSearch } from '@/hooks/use-location-search';
import type { MasterLocationResult } from '@/services/locations/location-api';

export interface LocationSelection {
  label: string;
  pincode: string;
  latitude: number;
  longitude: number;
  city: string;
  area?: string;
  state: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
}

interface LocationSearchInputProps {
  value?: string;
  onSelect: (selection: LocationSelection) => void;
  error?: string;
}

export function LocationSearchInput({ value = '', onSelect, error }: LocationSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: results = [], isFetching } = useLocationSearch(query);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSelect = (item: MasterLocationResult) => {
    onSelect(mapResult(item));
    setQuery(item.label);
    setOpen(false);
  };

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slate-400" />
        <Input
          label="Delivery locality *"
          placeholder="Search area, sector, or landmark"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
          error={error}
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-52 w-full space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {isFetching && (
            <Text variant="caption" className="px-3 py-2 text-slate-500">
              Searching…
            </Text>
          )}
          {!isFetching && results.length === 0 && (
            <Text variant="caption" className="px-3 py-2 text-slate-500">
              No matching locations in master directory.
            </Text>
          )}
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-brand-600" />
              <span>
                <span className="block text-sm font-medium text-slate-900">{item.label}</span>
                <span className="block text-xs text-slate-500">
                  {[item.area, item.city, item.pincode].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function mapResult(item: MasterLocationResult): LocationSelection {
  return {
    label: item.label,
    pincode: item.pincode ?? '',
    latitude: item.latitude,
    longitude: item.longitude,
    city: item.city,
    area: item.area,
    state: item.state,
    locationPincodeId: item.locationPincodeId,
    locationAreaId: item.locationAreaId,
    locationCityId: item.locationCityId,
  };
}
