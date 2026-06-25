import { useProfilePreferencesStore } from '@/store/profile-preferences-store';
import type {
  NotificationPreferences,
  ProfileSettings,
} from '@/features/profile/types';
import { fetchReferrals, fetchRewards } from '@/services/wallet/wallet-api';

function getStore() {
  return useProfilePreferencesStore.getState();
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return getStore().notifications;
}

export async function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean,
): Promise<NotificationPreferences> {
  getStore().setNotification(key, value);
  return getStore().notifications;
}

export async function getSettings(): Promise<ProfileSettings> {
  return getStore().settings;
}

export async function updateSettings(
  patch: Partial<ProfileSettings>,
): Promise<ProfileSettings> {
  getStore().setSettings(patch);
  return getStore().settings;
}

export async function getReferralInfo(_userId: string) {
  const data = await fetchReferrals();
  return { ...data, currency: 'INR' };
}

export async function getRewardsInfo() {
  const data = await fetchRewards();
  return {
    ...data,
    history: data.history.map((h) => ({
      id: h.id,
      title: h.description ?? h.type,
      points: Math.abs(h.points),
      date: h.createdAt,
      type: h.points >= 0 ? ('earned' as const) : ('redeemed' as const),
    })),
  };
}
