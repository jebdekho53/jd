import { create } from 'zustand';

/** App-wide open/close state for the floating search overlay. */
interface SearchUiState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useSearchUi = create<SearchUiState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
