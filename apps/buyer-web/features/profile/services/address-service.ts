import { useAddressStore } from '@/store/address-store';
import type { ProfileAddress, UpsertAddressInput } from '@/features/profile/types';

export function getAddresses(): ProfileAddress[] {
  return useAddressStore.getState().addresses;
}

export async function fetchAddresses(): Promise<ProfileAddress[]> {
  return getAddresses();
}

export async function createAddress(input: UpsertAddressInput): Promise<ProfileAddress> {
  return useAddressStore.getState().addAddress(input);
}

export async function updateAddress(
  id: string,
  patch: Partial<UpsertAddressInput>,
): Promise<ProfileAddress> {
  useAddressStore.getState().updateAddress(id, patch);
  const updated = getAddresses().find((a) => a.id === id);
  if (!updated) throw new Error('Address not found');
  return updated;
}

export async function deleteAddress(id: string): Promise<void> {
  useAddressStore.getState().removeAddress(id);
}

export async function setDefaultAddress(id: string): Promise<void> {
  useAddressStore.getState().setDefault(id);
}
