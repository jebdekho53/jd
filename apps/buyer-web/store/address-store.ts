import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AddressLabel, ProfileAddress, UpsertAddressInput } from '@/features/profile/types';

interface AddressState {
  addresses: ProfileAddress[];
  addAddress: (input: UpsertAddressInput) => ProfileAddress;
  updateAddress: (id: string, patch: Partial<UpsertAddressInput>) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      addAddress: (input) => {
        const id = `addr-${Date.now()}`;
        const addresses = get().addresses;
        const isDefault = input.isDefault ?? addresses.length === 0;
        const entry: ProfileAddress = {
          id,
          label: input.label,
          line1: input.line1,
          line2: input.line2,
          landmark: input.landmark,
          pincode: input.pincode,
          city: input.city,
          lat: input.lat,
          lng: input.lng,
          isDefault,
          createdAt: new Date().toISOString(),
        };
        set({
          addresses: [
            ...addresses.map((a) => (isDefault ? { ...a, isDefault: false } : a)),
            entry,
          ],
        });
        return entry;
      },
      updateAddress: (id, patch) =>
        set({
          addresses: get().addresses.map((a) =>
            a.id === id
              ? {
                  ...a,
                  ...patch,
                  label: (patch.label ?? a.label) as AddressLabel,
                }
              : a,
          ),
        }),
      removeAddress: (id) => {
        const remaining = get().addresses.filter((a) => a.id !== id);
        if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
          remaining[0]!.isDefault = true;
        }
        set({ addresses: remaining });
      },
      setDefault: (id) =>
        set({
          addresses: get().addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        }),
    }),
    { name: 'jebdekho-addresses' },
  ),
);
