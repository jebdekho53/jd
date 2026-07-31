import { create } from 'zustand';

interface DrawerState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/** Global toggle for the hamburger side-drawer, so any screen's header can
 *  trigger it without prop-drilling through the tab/stack navigators. */
export const useDrawerStore = create<DrawerState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
