'use client';

import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/design-system/primitives';
import { useLocationSearch, usePincodeLookup } from '@/hooks/use-location-search';
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
  pincode?: string;
  onSelect: (selection: LocationSelection) => void;
  error?: string;
  label?: string;
}

export function LocationSearchInput({
  value = '',
  pincode = '',
  onSelect,
  error,
  label = 'Business locality *',
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: results = [], isFetching } = useLocationSearch(query);
  const pinLookup = usePincodeLookup(pincode);
  const queryPinLookup = usePincodeLookup(query);
  const displayResults = /^\d{6}$/.test(query.trim()) && queryPinLookup.data?.length
    ? queryPinLookup.data
    : results;
  const searching = isFetching || queryPinLookup.isFetching;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (pinLookup.data?.[0] && /^\d{6}$/.test(pincode)) {
      const item = pinLookup.data[0];
      onSelect(mapResult(item));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pincode blur validation only
  }, [pinLookup.data, pincode]);

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
          label={label}
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
          {searching && (
            <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>
          )}
          {!searching && displayResults.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-500">
              No directory match. Enter a 6-digit pincode or use the map/current location.
            </p>
          )}
          {displayResults.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
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
