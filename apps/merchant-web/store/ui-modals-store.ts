import { create } from 'zustand';

let stepUpResolver: ((success: boolean) => void) | null = null;

interface UiModalsState {
  stepUpOpen: boolean;
  triggerStepUp: () => Promise<boolean>;
  resolveStepUp: (success: boolean) => void;
}

export const useUiModalsStore = create<UiModalsState>((set) => ({
  stepUpOpen: false,
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
