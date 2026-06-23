import { create } from 'zustand';

interface UiModalsState {
  globalLoading: boolean;
  locationPickerOpen: boolean;
  profileSetupOpen: boolean;
  setGlobalLoading: (v: boolean) => void;
  openLocationPicker: () => void;
  closeLocationPicker: () => void;
  openProfileSetup: () => void;
  closeProfileSetup: () => void;
}

export const useUiModalsStore = create<UiModalsState>((set) => ({
  globalLoading: false,
  locationPickerOpen: false,
  profileSetupOpen: false,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  openLocationPicker: () => set({ locationPickerOpen: true }),
  closeLocationPicker: () => set({ locationPickerOpen: false }),
  openProfileSetup: () => set({ profileSetupOpen: true }),
  closeProfileSetup: () => set({ profileSetupOpen: false }),
}));
