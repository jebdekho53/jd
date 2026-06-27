/** Parsed address from Google Places or Geocoder — UI/geocoding only; eligibility stays on backend. */
export interface ParsedGoogleAddress {
  formattedAddress: string;
  line1: string;
  line2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

type AddressComponent = google.maps.GeocoderAddressComponent;

function component(components: AddressComponent[], type: string, short = false): string {
  const match = components.find((c) => c.types.includes(type));
  if (!match) return '';
  return short ? match.short_name : match.long_name;
}

export function parseAddressComponents(
  components: AddressComponent[],
  lat: number,
  lng: number,
  formattedAddress?: string,
): ParsedGoogleAddress {
  const streetNumber = component(components, 'street_number');
  const route = component(components, 'route');
  const sublocality =
    component(components, 'sublocality_level_1') ||
    component(components, 'sublocality') ||
    component(components, 'neighborhood');
  const locality =
    component(components, 'locality') ||
    component(components, 'administrative_area_level_2');
  const city =
    component(components, 'locality') ||
    component(components, 'administrative_area_level_2') ||
    locality;
  const state = component(components, 'administrative_area_level_1');
  const pincode = component(components, 'postal_code');

  const line1 = [streetNumber, route].filter(Boolean).join(' ').trim() || sublocality || locality;
  const line2 = sublocality && line1 !== sublocality ? sublocality : undefined;

  return {
    formattedAddress: formattedAddress ?? [line1, city, state, pincode].filter(Boolean).join(', '),
    line1,
    line2,
    locality: sublocality || locality || city,
    city,
    state,
    pincode,
    lat,
    lng,
  };
}

export function parsePlaceResult(place: google.maps.places.PlaceResult): ParsedGoogleAddress | null {
  const components = place.address_components;
  const location = place.geometry?.location;
  if (!components?.length || !location) return null;

  return parseAddressComponents(
    components,
    location.lat(),
    location.lng(),
    place.formatted_address ?? place.name,
  );
}

export function parseGeocoderResult(result: google.maps.GeocoderResult): ParsedGoogleAddress | null {
  const location = result.geometry?.location;
  if (!result.address_components?.length || !location) return null;

  return parseAddressComponents(
    result.address_components,
    location.lat(),
    location.lng(),
    result.formatted_address,
  );
}
