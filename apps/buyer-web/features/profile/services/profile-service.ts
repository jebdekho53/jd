import { fetchMe } from '@/services/auth/auth-api';
import { useProfileStore } from '@/store/profile-store';
import { useProfilePreferencesStore } from '@/store/profile-preferences-store';
import type { ProfileUser, ProfileStats, UpdateProfileInput } from '@/features/profile/types';
import { isPlaceholderPhone } from '@/lib/phone';
import { listOrders } from '@/services/orders/orders-api';
import { getWishlistItems } from '@/features/profile/services/wishlist-service';
import { getAddresses } from '@/features/profile/services/address-service';
import { fetchWallet } from '@/services/wallet/wallet-api';

function getLocalProfile() {
  return useProfileStore.getState();
}

function getPreferences() {
  return useProfilePreferencesStore.getState();
}

export async function getProfile(): Promise<ProfileUser> {
  const auth = await fetchMe();
  if (!auth) {
    throw new Error('Not authenticated');
  }
  const local = getLocalProfile();
  const prefs = getPreferences();
  prefs.initReferralCode(auth.id);

  const displayName =
    local.displayName?.trim() ||
    `Customer ${auth.phone.slice(-4)}`;
  const phone = local.phone ?? (isPlaceholderPhone(auth.phone) ? '' : auth.phone);

  return {
    id: auth.id,
    phone,
    email: local.email ?? auth.email,
    displayName,
    avatarUrl: local.avatarUrl,
    phoneVerified: auth.phoneVerified && !isPlaceholderPhone(auth.phone),
    membershipTier: local.membershipTier,
    memberSince: auth.createdAt,
  };
}

export async function updateProfile(input: UpdateProfileInput): Promise<ProfileUser> {
  const store = getLocalProfile();
  if (input.displayName !== undefined) store.setDisplayName(input.displayName);
  if (input.email !== undefined) store.setEmail(input.email);
  if (input.phone !== undefined) store.setPhone(input.phone);
  if (input.avatarUrl !== undefined) store.setAvatarUrl(input.avatarUrl);
  return getProfile();
}

export async function getProfileStats(): Promise<ProfileStats> {
  const [ordersResult, addresses, wishlist] = await Promise.all([
    listOrders({ limit: 50 }).catch(() => ({
      orders: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    })),
    Promise.resolve(getAddresses()),
    Promise.resolve(getWishlistItems()),
  ]);

  const items = ordersResult.orders ?? [];
  const activeStatuses = new Set([
    'CREATED',
    'PAYMENT_PENDING',
    'PAID',
    'MERCHANT_ACCEPTED',
    'PREPARING',
    'PACKING',
    'READY_FOR_PICKUP',
    'RIDER_ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
  ]);
  const cancelledStatuses = new Set([
    'CANCELLED_BY_BUYER',
    'CANCELLED_BY_MERCHANT',
    'CANCELLED_BY_ADMIN',
  ]);
  const activeOrders = items.filter((o) => activeStatuses.has(o.status)).length;
  const cancelledOrders = items.filter((o) => cancelledStatuses.has(o.status)).length;
  const prefs = getPreferences();
  let walletBalance = prefs.walletBalance;
  let loyaltyPoints = prefs.loyaltyPoints;
  try {
    const wallet = await fetchWallet();
    walletBalance = wallet.balance;
    loyaltyPoints = wallet.rewardPoints;
  } catch {
    // fallback to local prefs when unauthenticated path
  }

  return {
    totalOrders: ordersResult.meta?.total ?? items.length,
    activeOrders,
    cancelledOrders,
    savedAddresses: addresses.length,
    wishlistCount: wishlist.length,
    walletBalance,
    loyaltyPoints,
  };
}

export async function uploadAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Image must be under 2MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export async function removeAvatar(): Promise<void> {
  getLocalProfile().setAvatarUrl(null);
}
