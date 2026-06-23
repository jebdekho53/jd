import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  displayName: string | null;
  onboardingCompleted: boolean;
  setDisplayName: (name: string | null) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: null,
      onboardingCompleted: false,
      setDisplayName: (displayName) => set({ displayName }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      reset: () => set({ displayName: null, onboardingCompleted: false }),
    }),
    { name: 'jebdekho-profile' },
  ),
);
