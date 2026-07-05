import { create } from 'zustand';

let stepUpResolver: ((success: boolean) => void) | null = null;

interface UiModalsState {
  globalLoading: boolean;
  locationPickerOpen: boolean;
  profileSetupOpen: boolean;
  stepUpOpen: boolean;
  setGlobalLoading: (v: boolean) => void;
  openLocationPicker: () => void;
  closeLocationPicker: () => void;
  openProfileSetup: () => void;
  closeProfileSetup: () => void;
  triggerStepUp: () => Promise<boolean>;
  resolveStepUp: (success: boolean) => void;
}

export const useUiModalsStore = create<UiModalsState>((set) => ({
  globalLoading: false,
  locationPickerOpen: false,
  profileSetupOpen: false,
  stepUpOpen: false,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  openLocationPicker: () => set({ locationPickerOpen: true }),
  closeLocationPicker: () => set({ locationPickerOpen: false }),
  openProfileSetup: () => set({ profileSetupOpen: true }),
  closeProfileSetup: () => set({ profileSetupOpen: false }),
  triggerStepUp: () => new Promise<boolean>((resolve) => {
    stepUpResolver = resolve;
    set({ stepUpOpen: true });
  }),
  resolveStepUp: (success: boolean) => {
    if (stepUpResolver) {
      stepUpResolver(success);
      stepUpResolver = null;
    }
    set({ stepUpOpen: false });
  },
}));
