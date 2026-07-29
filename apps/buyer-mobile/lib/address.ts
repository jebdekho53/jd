import type { BuyerAddress } from '@/types/address';
import type { DeliveryAddress } from '@/types/checkout';

/** Maps a saved address onto the shape both checkouts post as
 *  `deliveryAddress` (apps/api's DeliveryAddressDto). */
export function toDeliveryAddress(address: BuyerAddress): DeliveryAddress {
  return {
    line1: address.line1,
    line2: address.line2 ?? undefined,
    locality: address.landmark ?? undefined,
    city: address.city,
    pincode: address.pincode,
    lat: address.latitude,
    lng: address.longitude,
  };
}

/** The API rejects a checkout whose coordinates are missing or meaningless,
 *  so guard before enabling the place-order button. */
export function hasUsableCoordinates(address: BuyerAddress | null): boolean {
  if (!address) return false;
  const { latitude, longitude } = address;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return !(latitude === 0 && longitude === 0);
}
