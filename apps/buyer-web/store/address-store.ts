import { create } from 'zustand';
import type { AddressLabel, ProfileAddress, UpsertAddressInput } from '@/features/profile/types';

interface AddressState {
  addresses: ProfileAddress[];
  /** Replaces the whole list from a server fetch — used to hydrate on login. */
  hydrate: (addresses: ProfileAddress[]) => void;
  /** Clears local state — used on logout so one account's addresses can never
   *  bleed into the next session on a shared browser/device. */
  reset: () => void;
  addAddress: (input: UpsertAddressInput) => ProfileAddress;
  updateAddress: (id: string, patch: Partial<UpsertAddressInput>) => void;
  removeAddress: (id: string) => void;
  setDefault: (id: string) => void;
}

// Deliberately not persisted to localStorage: this store is a read-through
// cache of the server's per-user address book (see services/addresses and
// components/providers/address-book-sync.tsx), hydrated on login and reset
// on logout. Persisting it to disk previously let one account's saved
// addresses leak into whatever account next logged in on the same browser.
export const useAddressStore = create<AddressState>()((set, get) => ({
  addresses: [],
  hydrate: (addresses) => set({ addresses }),
  reset: () => set({ addresses: [] }),
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
}));
