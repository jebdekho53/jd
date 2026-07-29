/** Mirrors the buyer wallet/rewards/referrals responses in
 *  apps/api/src/modules/wallet-loyalty. */

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface WalletSummary {
  balance: number;
  rewardPoints: number;
  tier: string;
  referralCode: string;
  lifetimePoints: number;
  expiringCreditsCount: number;
  transactions: WalletTransaction[];
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface RewardTransaction {
  id: string;
  type: string;
  /** Negative when points were spent. */
  points: number;
  description: string | null;
  createdAt: string;
}

export interface RewardsSummary {
  points: number;
  tier: LoyaltyTier;
  nextTierPoints: number;
  lifetimePoints: number;
  history: RewardTransaction[];
}

export interface ReferralSummary {
  code: string;
  inviteCount: number;
  earnings: number;
  pendingCount: number;
}
