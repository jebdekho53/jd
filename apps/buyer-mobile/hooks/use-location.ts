import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '@/store/location-store';

/** Requests foreground location once and stores it; falls back to a default
 *  coordinate (Delhi) if denied so browse/search still work. */
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
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      } catch {
        setPermissionDenied();
      }
    })();
  }, [lat, lng, setLocation, setPermissionDenied]);
}
