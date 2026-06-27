'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Button, Input, Modal, Text } from '@/design-system/primitives';
import { GooglePlacesAutocomplete, GoogleMapPicker, useGoogleMaps, DEFAULT_MAP_CENTER, type ParsedGoogleAddress } from '@jebdekho/google-maps';
import { requestBrowserLocation } from '@/lib/geolocation';
import { useLocationSearch } from '@/hooks/use-location-search';
import { useReverseGeocode } from '@/hooks/use-reverse-geocode';
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
  const { isConfigured } = useGoogleMaps();
  const { geocode, isLoading: isGeocoding } = useReverseGeocode();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number }>(DEFAULT_MAP_CENTER);
  const [preview, setPreview] = useState<{
    lat: number;
    lng: number;
    label: string;
    pincode?: string;
    city?: string;
    area?: string;
  } | null>(null);
  const { data: results = [], isFetching } = useLocationSearch(query);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setError(null);
      setPreview(null);
    }
  }, [open]);

  const confirmMaster = (coords: {
    lat: number;
    lng: number;
    label: string;
    pincode?: string;
    city?: string;
    area?: string;
    locationPincodeId?: string;
    locationAreaId?: string;
    locationCityId?: string;
  }) => {
    setFromMaster(coords);
    setMapPosition({ lat: coords.lat, lng: coords.lng });
    onConfirm?.();
    if (!required) onClose();
  };

  const handleGps = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await requestBrowserLocation();
      if (isConfigured) {
        const parsed = await geocode(pos.lat, pos.lng);
        if (parsed) {
          confirmMaster({
            lat: parsed.lat,
            lng: parsed.lng,
            label: parsed.locality || parsed.formattedAddress,
            pincode: parsed.pincode || undefined,
            city: parsed.city,
            area: parsed.locality,
          });
          return;
        }
      }
      setFromGps(pos.lat, pos.lng);
      setMapPosition({ lat: pos.lat, lng: pos.lng });
      onConfirm?.();
      if (!required) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: MasterLocationResult) => {
    confirmMaster({
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
  };

  const handlePreset = (preset: (typeof FALLBACK_LOCATIONS)[number]) => {
    confirmMaster({
      lat: preset.lat,
      lng: preset.lng,
      label: preset.label,
      pincode: preset.pincode,
    });
  };

  const handleGooglePlace = (address: ParsedGoogleAddress) => {
    setMapPosition({ lat: address.lat, lng: address.lng });
    setPreview({
      lat: address.lat,
      lng: address.lng,
      label: address.locality || address.formattedAddress,
      pincode: address.pincode || undefined,
      city: address.city,
      area: address.locality,
    });
  };

  const handleMapMove = async (coords: { lat: number; lng: number }) => {
    setMapPosition(coords);
    if (!isConfigured) return;
    const parsed = await geocode(coords.lat, coords.lng);
    if (parsed) {
      setPreview({
        lat: parsed.lat,
        lng: parsed.lng,
        label: parsed.locality || parsed.formattedAddress,
        pincode: parsed.pincode || undefined,
        city: parsed.city,
        area: parsed.locality,
      });
    }
  };

  const handleConfirmPreview = () => {
    if (!preview) return;
    confirmMaster(preview);
    setPreview(null);
  };

  return (
    <Modal
      open={open}
      onClose={required ? () => {} : onClose}
      dismissible={!required}
      title="Set delivery location"
      description={
        isConfigured
          ? 'Search on Google Maps, use GPS, or pick from our directory.'
          : 'Search your area, sector, or pincode. We use official India Post data for Delhi NCR.'
      }
      size="md"
    >
      <div className="space-y-6">
        <Button fullWidth loading={loading || isGeocoding} onClick={handleGps}>
          <Navigation className="h-4 w-4" aria-hidden />
          Use current location
        </Button>

        {isConfigured && (
          <>
            <GooglePlacesAutocomplete
              label="Search address"
              placeholder="Street, area, or landmark"
              onPlaceSelect={handleGooglePlace}
            />
            <GoogleMapPicker
              position={mapPosition}
              onPositionChange={handleMapMove}
              heightClassName="h-40 sm:h-48"
              disabled={isGeocoding}
            />
            {preview && (
              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                <p className="font-medium text-emerald-900">{preview.label}</p>
                <p className="text-emerald-800">
                  {[preview.area, preview.city, preview.pincode].filter(Boolean).join(' · ')}
                </p>
                <Button type="button" fullWidth size="sm" onClick={handleConfirmPreview}>
                  Confirm this location
                </Button>
              </div>
            )}
          </>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500">
              {isConfigured ? 'or directory search' : 'or search'}
            </span>
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
