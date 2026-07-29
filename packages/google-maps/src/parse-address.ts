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
  googlePlaceId?: string;
  viewport?: google.maps.LatLngBoundsLiteral;
}

type AddressComponent = google.maps.GeocoderAddressComponent;

/** Normalize Indian pincode from component text or formatted address (e.g. "201 206" → "201206"). */
export function normalizeIndianPincode(raw: string, formattedAddress?: string): string {
  const digits = raw.replace(/\D/g, '');
  if (/^\d{6}$/.test(digits)) return digits;
  if (formattedAddress) {
    const match = formattedAddress.match(/\b(\d{6})\b/);
    if (match) return match[1];
  }
  return '';
}

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
  const pincode = normalizeIndianPincode(
    component(components, 'postal_code', true) || component(components, 'postal_code'),
    formattedAddress,
  );

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

  const parsed = parseAddressComponents(
    components,
    location.lat(),
    location.lng(),
    place.formatted_address ?? place.name,
  );
  return {
    ...parsed,
    googlePlaceId: place.place_id,
    viewport: place.geometry?.viewport?.toJSON(),
  };
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

/**
 * Pick the best result from reverse geocode. Google orders results from most
 * specific (rooftop/street/sublocality) to least specific (city, then
 * country) — this used to jump straight to any result independently typed as
 * `postal_code`, which is a coarser, city/pincode-area-level result. That
 * discarded a more specific sublocality-level result even when one existed
 * earlier in the same list with the exact same valid pincode, collapsing
 * `locality` down to just the city name (e.g. "Ghaziabad" / "Ghaziabad"
 * instead of the actual neighbourhood). Now takes the first result in
 * Google's own specificity order that has a usable 6-digit pincode.
 */
export function parseGeocoderResults(results: google.maps.GeocoderResult[]): ParsedGoogleAddress | null {
  if (!results.length) return null;

  let fallback: ParsedGoogleAddress | null = null;
  for (const result of results) {
    const parsed = parseGeocoderResult(result);
    if (!parsed) continue;
    if (!fallback) fallback = parsed;
    if (parsed.pincode) return parsed;
  }

  return fallback;
}
