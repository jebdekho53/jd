import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '@/store/location-store';
import { reverseGeocode } from '@/services/buyer-api';

/** Requests foreground location once and stores it; falls back to a default
 *  coordinate (Delhi) if denied so browse/search still work. Reverse-geocodes
 *  the fix so "Delivering near {label}" shows a real locality instead of
 *  always falling back to "you" — best-effort, GPS coords are kept either
 *  way if the geocode call fails or Maps isn't configured. */
export function useEnsureLocation() {
  const { lat, lng, setLocation, setPermissionDenied } = useLocationStore();

  useEffect(() => {
    if (lat != null && lng != null) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionDenied();
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(coords);
        const address = await reverseGeocode(coords.lat, coords.lng).catch(() => null);
        if (address) {
          setLocation({ ...coords, label: address.locality || address.city, pincode: address.pincode || undefined });
        }
      } catch {
        setPermissionDenied();
      }
    })();
  }, [lat, lng, setLocation, setPermissionDenied]);
}
