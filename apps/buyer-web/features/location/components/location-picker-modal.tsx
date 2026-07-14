'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import { Button, Modal } from '@/design-system/primitives';
import { GooglePlacesAutocomplete, GoogleMapPicker, useGoogleMaps, MAP_INITIAL_VISUAL_CENTER, type ParsedGoogleAddress } from '@jebdekho/google-maps';
import { requestBrowserLocation } from '@/lib/geolocation';
import { useReverseGeocode } from '@/hooks/use-reverse-geocode';
import { useLocationStore } from '@/store/location-store';

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
  const { setFromGps, setFromGoogle } = useLocationStore();
  const savedLocation = useLocationStore();
  const { isConfigured } = useGoogleMaps();
  const { geocode, isLoading: isGeocoding } = useReverseGeocode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number }>(MAP_INITIAL_VISUAL_CENTER);
  const [placeViewport, setPlaceViewport] = useState<google.maps.LatLngBoundsLiteral | null>(null);
  const [preview, setPreview] = useState<{
    lat: number;
    lng: number;
    label: string;
    pincode?: string;
    city?: string;
    area?: string;
  } | null>(null);

  // Latest saved location, read only when the modal opens. Keeping it in a ref (rather
  // than in the effect deps) means a background store update can't reset the map while
  // the user is mid-search — that used to snap the pin back to the saved location.
  const savedLocationRef = useRef(savedLocation);
  savedLocationRef.current = savedLocation;

  useEffect(() => {
    if (!open) {
      setError(null);
      setPreview(null);
      setPlaceViewport(null);
      return;
    }

    // Seed the map from the saved location once, on open.
    const saved = savedLocationRef.current;
    setPlaceViewport(null);

    if (saved.isReady && saved.lat && saved.lng) {
      setMapPosition({ lat: saved.lat, lng: saved.lng });
      setPreview({
        lat: saved.lat,
        lng: saved.lng,
        label: saved.label,
        pincode: saved.pincode,
        city: saved.city,
        area: saved.area,
      });
      return;
    }

    setMapPosition(MAP_INITIAL_VISUAL_CENTER);
    setPreview(null);
  }, [open]);

  const confirmGoogleLocation = (coords: {
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
    setFromGoogle(coords);
    setMapPosition({ lat: coords.lat, lng: coords.lng });
    onConfirm?.();
    if (!required) onClose();
  };

  const handleGps = async () => {
    setLoading(true);
    setError(null);
    setPlaceViewport(null);
    try {
      const pos = await requestBrowserLocation();
      if (isConfigured) {
        const parsed = await geocode(pos.lat, pos.lng);
        if (parsed) {
          confirmGoogleLocation({
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

  const handleGooglePlace = useCallback(
    async (address: ParsedGoogleAddress) => {
      setError(null);
      // Move the map immediately so the pin always follows the search.
      setMapPosition({ lat: address.lat, lng: address.lng });
      setPlaceViewport(address.viewport ?? null);
      setPreview({
        lat: address.lat,
        lng: address.lng,
        label: address.locality || address.formattedAddress,
        pincode: address.pincode || undefined,
        city: address.city,
        area: address.locality,
      });

      // Locality-level results (e.g. "Muradnagar") often carry no pincode, which
      // serviceability needs — backfill it from a reverse geocode of the coords.
      if (address.pincode || !isConfigured) return;
      const parsed = await geocode(address.lat, address.lng);
      if (!parsed?.pincode) return;
      setPreview((current) =>
        current && current.lat === address.lat && current.lng === address.lng
          ? { ...current, pincode: parsed.pincode, city: current.city || parsed.city }
          : current,
      );
    },
    [geocode, isConfigured],
  );

  const handleMapMove = async (coords: { lat: number; lng: number }) => {
    setMapPosition(coords);
    setPlaceViewport(null);
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
    confirmGoogleLocation(preview);
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
          ? 'Search on Google Maps, use GPS, or drag the pin to set your delivery location.'
          : 'Google Maps is not configured. Add a valid browser API key to enable address search and map pin selection.'
      }
      size="md"
    >
      <div className="space-y-6">
        <Button fullWidth loading={loading || isGeocoding} onClick={handleGps}>
          <Navigation className="h-4 w-4" aria-hidden />
          Use current location
        </Button>

        {isConfigured ? (
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
              viewport={placeViewport}
              address={preview?.label}
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
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Google Maps is required for location selection. Configure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
            for buyer-web.
          </div>
        )}
      </div>
    </Modal>
  );
}
