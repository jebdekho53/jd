export type AddressLabel = 'Home' | 'Work' | 'Other';
export type MembershipTier = 'member' | 'gold' | 'platinum';
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ProfileAddress {
  id: string;
  label: AddressLabel;
  line1: string;
  line2?: string;
  landmark?: string;
  pincode: string;
  city?: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface ProfileUser {
  id: string;
  phone: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  phoneVerified: boolean;
  membershipTier: MembershipTier;
  memberSince: string;
}

export interface ProfileStats {
  totalOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  savedAddresses: number;
  wishlistCount: number;
  walletBalance: number;
  loyaltyPoints: number;
}

export interface NotificationPreferences {
  orders: boolean;
  offers: boolean;
  delivery: boolean;
  account: boolean;
}

export interface ProfileSettings {
  darkMode: boolean;
  language: string;
  locationPreference: string;
}

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking';
  label: string;
  detail: string;
  isDefault: boolean;
}

export interface ReferralInfo {
  code: string;
  inviteCount: number;
  earnings: number;
  currency: string;
}

export interface RewardEntry {
  id: string;
  title: string;
  points: number;
  date: string;
  type: 'earned' | 'redeemed';
}

export interface RewardsInfo {
  points: number;
  tier: LoyaltyTier;
  nextTierPoints: number;
  history: RewardEntry[];
}

export interface LoginSession {
  id: string;
  deviceName: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UpdateProfileInput {
  displayName?: string;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface UpsertAddressInput {
  label: AddressLabel;
  line1: string;
  line2?: string;
  landmark?: string;
  pincode: string;
  city?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}
