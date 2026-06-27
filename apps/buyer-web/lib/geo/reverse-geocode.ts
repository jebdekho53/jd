import { parseGeocoderResult, type ParsedGoogleAddress } from '@jebdekho/google-maps';

export async function reverseGeocode(lat: number, lng: number): Promise<ParsedGoogleAddress> {
  if (typeof google === 'undefined' || !google.maps?.Geocoder) {
    throw new Error('Google Maps is not loaded');
  }

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        reject(new Error('Could not find an address for this location'));
        return;
      }
      const parsed = parseGeocoderResult(results[0]);
      if (!parsed) {
        reject(new Error('Could not parse address for this location'));
        return;
      }
      resolve(parsed);
    });
  });
}
