import type { ProfileAddress } from '@/features/profile/types';
import type { DeliveryAddress } from '@/types/checkout';
import { useAddressStore } from '@/store/address-store';
import { useLocationStore } from '@/store/location-store';

export function profileAddressToDelivery(addr: ProfileAddress): DeliveryAddress {
  return {
    line1: addr.line1,
    line2: addr.line2,
    locality: addr.landmark ?? addr.city ?? '',
    city: addr.city ?? '',
    pincode: addr.pincode,
    lat: addr.lat ?? 28.6139,
    lng: addr.lng ?? 77.209,
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
  useLocationStore.getState().setFromMaster({
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
  return preferred ? profileAddressToDelivery(preferred) : null;
}
