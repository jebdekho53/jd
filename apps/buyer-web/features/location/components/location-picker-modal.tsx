'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Button, Input, Modal, Text } from '@/design-system/primitives';
import { requestBrowserLocation } from '@/lib/geolocation';
import { useLocationSearch } from '@/hooks/use-location-search';
import type { MasterLocationResult } from '@/services/locations/location-api';
import { FALLBACK_LOCATIONS, useLocationStore } from '@/store/location-store';

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  required?: boolean;
}

export function LocationPickerModal({
  open,
  onClose,
  onConfirm,
  required = false,
}: LocationPickerModalProps) {
  const { setFromGps, setFromMaster } = useLocationStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: results = [], isFetching } = useLocationSearch(query);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setError(null);
    }
  }, [open]);

  const handleGps = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await requestBrowserLocation();
      setFromGps(pos.lat, pos.lng);
      onConfirm?.();
      if (!required) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: MasterLocationResult) => {
    setFromMaster({
      lat: item.latitude,
      lng: item.longitude,
      label: item.label,
      pincode: item.pincode,
      city: item.city,
      area: item.area,
      locationPincodeId: item.locationPincodeId,
      locationAreaId: item.locationAreaId,
      locationCityId: item.locationCityId,
    });
    onConfirm?.();
    if (!required) onClose();
  };

  const handlePreset = (preset: (typeof FALLBACK_LOCATIONS)[number]) => {
    setFromMaster({
      lat: preset.lat,
      lng: preset.lng,
      label: preset.label,
      pincode: preset.pincode,
    });
    onConfirm?.();
    if (!required) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={required ? () => {} : onClose}
      dismissible={!required}
      title="Set delivery location"
      description="Search your area, sector, or pincode. We use official India Post data for Delhi NCR."
      size="md"
    >
      <div className="space-y-6">
        <Button fullWidth loading={loading} onClick={handleGps}>
          <Navigation className="h-4 w-4" aria-hidden />
          Use current location
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">or search</span>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-neutral-400" />
          <Input
            label="Area, sector, or pincode"
            placeholder="e.g. Muradnagar, Sector 62 Noida, 201206"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            error={error ?? undefined}
          />
        </div>

        {query.trim().length >= 2 && (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-1">
            {isFetching && (
              <Text variant="caption" className="px-3 py-2 text-neutral-500">
                Searching…
              </Text>
            )}
            {!isFetching && results.length === 0 && (
              <Text variant="caption" className="px-3 py-2 text-neutral-500">
                No locations found. Try a nearby area or pincode.
              </Text>
            )}
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-emerald-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>
                  <span className="block text-sm font-medium text-neutral-900">{item.label}</span>
                  <span className="block text-xs text-neutral-500">
                    {[item.area, item.city, item.pincode].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div>
          <Text variant="label" className="mb-3 block">
            Quick picks
          </Text>
          <div className="flex flex-wrap gap-2">
            {FALLBACK_LOCATIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() => handlePreset(loc)}
                className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-emerald-500 hover:text-emerald-700"
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
