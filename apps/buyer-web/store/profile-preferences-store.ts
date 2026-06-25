import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotificationPreferences, ProfileSettings } from '@/features/profile/types';

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  orders: true,
  offers: true,
  delivery: true,
  account: true,
};

const DEFAULT_SETTINGS: ProfileSettings = {
  darkMode: false,
  language: 'en',
  locationPreference: 'auto',
};

interface ProfilePreferencesState {
  notifications: NotificationPreferences;
  settings: ProfileSettings;
  referralCode: string;
  loyaltyPoints: number;
  walletBalance: number;
  setNotification: (key: keyof NotificationPreferences, value: boolean) => void;
  setSettings: (patch: Partial<ProfileSettings>) => void;
  setLoyaltyPoints: (points: number) => void;
  initReferralCode: (userId: string) => void;
}

function generateReferralCode(userId: string): string {
  return `JEB${userId.slice(-4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
}

export const useProfilePreferencesStore = create<ProfilePreferencesState>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,
      settings: DEFAULT_SETTINGS,
      referralCode: '',
      loyaltyPoints: 120,
      walletBalance: 0,
      setNotification: (key, value) =>
        set({ notifications: { ...get().notifications, [key]: value } }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setLoyaltyPoints: (points) => set({ loyaltyPoints: points }),
      initReferralCode: (userId) => {
        if (!get().referralCode) {
          set({ referralCode: generateReferralCode(userId) });
        }
      },
    }),
    { name: 'jebdekho-profile-preferences' },
  ),
);
