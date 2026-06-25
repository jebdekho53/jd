import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MembershipTier } from '@/features/profile/types';

interface ProfileState {
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  membershipTier: MembershipTier;
  onboardingCompleted: boolean;
  setDisplayName: (name: string | null) => void;
  setEmail: (email: string | null) => void;
  setAvatarUrl: (url: string | null) => void;
  setMembershipTier: (tier: MembershipTier) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: null,
      email: null,
      avatarUrl: null,
      membershipTier: 'member',
      onboardingCompleted: false,
      setDisplayName: (displayName) => set({ displayName }),
      setEmail: (email) => set({ email }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      setMembershipTier: (membershipTier) => set({ membershipTier }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      reset: () =>
        set({
          displayName: null,
          email: null,
          avatarUrl: null,
          membershipTier: 'member',
          onboardingCompleted: false,
        }),
    }),
    { name: 'jebdekho-profile' },
  ),
);
