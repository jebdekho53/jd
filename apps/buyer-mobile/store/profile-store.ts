import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Display-name and email overrides live on the device, exactly as they do in
 * buyer-web. `PATCH /buyer/profile` in apps/api is still a stub that returns
 * success without persisting anything, so sending these to the server would
 * silently drop them. Swap this for the real endpoint once it writes.
 */
interface ProfileState {
  displayName: string | null;
  email: string | null;
  hydrated: boolean;
  setDisplayName: (value: string | null) => void;
  setEmail: (value: string | null) => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: null,
      email: null,
      hydrated: false,
      setDisplayName: (displayName) => set({ displayName }),
      setEmail: (email) => set({ email }),
      clear: () => set({ displayName: null, email: null }),
    }),
    {
      name: 'buyer-profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ displayName: state.displayName, email: state.email }),
      onRehydrateStorage: () => () => {
        useProfileStore.setState({ hydrated: true });
      },
    },
  ),
);
