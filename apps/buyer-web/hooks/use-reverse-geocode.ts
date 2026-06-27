import { useCallback, useState } from 'react';
import { useGoogleMaps, type ParsedGoogleAddress } from '@jebdekho/google-maps';
import { reverseGeocode } from '@/lib/geo/reverse-geocode';

async function reverseGeocodeCached(lat: number, lng: number): Promise<ParsedGoogleAddress | null> {
  try {
    const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`, { credentials: 'include' });
    if (res.ok) {
      const json = (await res.json()) as { data?: ParsedGoogleAddress | null };
      if (json.data) return json.data;
    }
  } catch {
    /* fall through to client geocoder */
  }
  return reverseGeocode(lat, lng);
}

export function useReverseGeocode() {
  const { isLoaded } = useGoogleMaps();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(
    async (lat: number, lng: number): Promise<ParsedGoogleAddress | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const cached = await reverseGeocodeCached(lat, lng);
        if (cached) return cached;
        if (!isLoaded) {
          setError('Maps are still loading');
          return null;
        }
        return await reverseGeocode(lat, lng);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Reverse geocoding failed');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoaded],
  );

  return { geocode, isLoading, error, isReady: isLoaded };
}
