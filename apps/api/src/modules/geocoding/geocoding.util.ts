import type { GeocodedAddress } from './geocoding-cache.service';

interface GoogleGeocodeResponse {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

function component(
  components: NonNullable<GoogleGeocodeResponse['results']>[number]['address_components'],
  type: string,
): string {
  if (!components) return '';
  const match = components.find((c) => c.types.includes(type));
  return match?.long_name ?? '';
}

export function parseGeocoderResponse(
  data: GoogleGeocodeResponse,
  fallbackLat: number,
  fallbackLng: number,
): GeocodedAddress | null {
  if (data.status !== 'OK' || !data.results?.[0]) return null;
  const result = data.results[0];
  const components = result.address_components ?? [];
  const lat = result.geometry?.location?.lat ?? fallbackLat;
  const lng = result.geometry?.location?.lng ?? fallbackLng;

  const streetNumber = component(components, 'street_number');
  const route = component(components, 'route');
  const sublocality =
    component(components, 'sublocality_level_1') ||
    component(components, 'sublocality') ||
    component(components, 'neighborhood');
  const locality = component(components, 'locality') || component(components, 'administrative_area_level_2');
  const city = component(components, 'locality') || component(components, 'administrative_area_level_2') || locality;
  const state = component(components, 'administrative_area_level_1');
  const pincode = component(components, 'postal_code');
  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim() || sublocality || locality;

  return {
    formattedAddress: result.formatted_address ?? line1,
    line1,
    line2: sublocality && line1 !== sublocality ? sublocality : undefined,
    locality: sublocality || locality || city,
    city,
    state,
    pincode,
    lat,
    lng,
  };
}
