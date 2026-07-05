import type { ProfileAddress } from '@/features/profile/types';
import type { DeliveryAddress } from '@/types/checkout';
import { useAddressStore } from '@/store/address-store';
import { useLocationStore } from '@/store/location-store';

export function isDefaultDelhiCoords(lat: number, lng: number): boolean {
  return (
    Math.abs(lat - 28.6139) < 0.0001 &&
    Math.abs(lng - 77.209) < 0.0001
  );
}

export function isAddressGeoComplete(
  lat: number | undefined,
  lng: number | undefined,
): boolean {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat === 0 && lng === 0) return false;
  return !isDefaultDelhiCoords(lat, lng);
}

export function isDeliveryAddressComplete(
  address: Partial<DeliveryAddress> | null | undefined,
): boolean {
  if (!address) return false;
  const line1 = address.line1?.trim();
  const pincode = address.pincode?.trim();
  const city = address.city?.trim();
  if (!line1 || !pincode || !city) return false;
  if (!/^\d{6}$/.test(pincode)) return false;
  return isAddressGeoComplete(address.lat, address.lng);
}

export function profileAddressToDelivery(addr: ProfileAddress): DeliveryAddress {
  return {
    line1: addr.line1,
    line2: addr.line2,
    locality: addr.landmark ?? addr.city ?? '',
    city: addr.city ?? '',
    pincode: addr.pincode,
    lat: addr.lat ?? 0,
    lng: addr.lng ?? 0,
  };
}

/** Persist checkout address locally and mark as default saved address (Blinkit-style). */
export function persistDeliveryAddress(addr: DeliveryAddress): void {
  const store = useAddressStore.getState();
  const existing = store.addresses.find(
    (a) => a.pincode === addr.pincode && a.line1.trim() === addr.line1.trim(),
  );

  if (existing) {
    store.updateAddress(existing.id, {
      line2: addr.line2,
      landmark: addr.locality,
      city: addr.city,
      lat: addr.lat,
      lng: addr.lng,
    });
    store.setDefault(existing.id);
  } else {
    store.addAddress({
      label: 'Home',
      line1: addr.line1,
      line2: addr.line2,
      landmark: addr.locality,
      pincode: addr.pincode,
      city: addr.city,
      lat: addr.lat,
      lng: addr.lng,
      isDefault: true,
    });
  }

  const label = [addr.locality, addr.city].filter(Boolean).join(', ') || addr.line1;
  useLocationStore.getState().setFromGoogle({
    lat: addr.lat,
    lng: addr.lng,
    label,
    pincode: addr.pincode,
    city: addr.city,
    area: addr.locality,
    locationPincodeId: addr.locationPincodeId,
    locationAreaId: addr.locationAreaId,
    locationCityId: addr.locationCityId,
  });
}

export function getDefaultSavedDeliveryAddress(): DeliveryAddress | null {
  const addresses = useAddressStore.getState().addresses;
  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
  if (!preferred) return null;
  const delivery = profileAddressToDelivery(preferred);
  return isDeliveryAddressComplete(delivery) ? delivery : null;
}

/** Restore pinned delivery location from saved addresses when location store is empty. */
export function restoreDeliveryLocationFromSavedAddress(): boolean {
  const location = useLocationStore.getState();
  if (location.isReady && location.lat && location.lng) {
    return true;
  }

  const saved = getDefaultSavedDeliveryAddress();
  if (!saved) return false;

  persistDeliveryAddress(saved);
  return true;
}
