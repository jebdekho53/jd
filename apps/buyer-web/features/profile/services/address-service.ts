import { useAddressStore } from '@/store/address-store';
import type { ProfileAddress, UpsertAddressInput } from '@/features/profile/types';
import {
  listAddressesRemote,
  createAddressRemote,
  updateAddressRemote,
  deleteAddressRemote,
} from '@/services/addresses/address-api';

export function getAddresses(): ProfileAddress[] {
  return useAddressStore.getState().addresses;
}

export async function fetchAddresses(): Promise<ProfileAddress[]> {
  const addresses = await listAddressesRemote();
  useAddressStore.getState().hydrate(addresses);
  return addresses;
}

export async function createAddress(input: UpsertAddressInput): Promise<ProfileAddress> {
  const created = await createAddressRemote(input);
  await fetchAddresses();
  return created;
}

export async function updateAddress(
  id: string,
  patch: Partial<UpsertAddressInput>,
): Promise<ProfileAddress> {
  const updated = await updateAddressRemote(id, patch);
  await fetchAddresses();
  return updated;
}

export async function deleteAddress(id: string): Promise<void> {
  await deleteAddressRemote(id);
  await fetchAddresses();
}

export async function setDefaultAddress(id: string): Promise<void> {
  await updateAddressRemote(id, { isDefault: true });
  await fetchAddresses();
}
