import {
  parseGeocoderResults,
  type ParsedGoogleAddress,
} from './parse-address';

/** Reverse geocode via browser Google Maps JS API (uses NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). */
export function reverseGeocodeClient(lat: number, lng: number): Promise<ParsedGoogleAddress | null> {
  if (typeof google === 'undefined' || !google.maps?.Geocoder) {
    return Promise.resolve(null);
  }

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng }, region: 'in' }, (results, status) => {
      if (status !== 'OK' || !results?.length) {
        resolve(null);
        return;
      }
      resolve(parseGeocoderResults(results));
    });
  });
}
