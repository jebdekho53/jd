import { buyerFetch } from '@/services/api/buyer-auth-client';

export interface WalletSummary {
  balance: number;
  rewardPoints: number;
  tier: string;
  referralCode: string;
  lifetimePoints: number;
  expiringCreditsCount: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
}

export async function fetchWallet() {
  const res = await buyerFetch<{ success: boolean; data: WalletSummary }>('/api/buyer/wallet');
  return res.data;
}

export async function fetchRewards() {
  const res = await buyerFetch<{ success: boolean; data: {
    points: number;
    tier: string;
    nextTierPoints: number;
    lifetimePoints: number;
    history: Array<{ id: string; type: string; points: number; description: string | null; createdAt: string }>;
  } }>('/api/buyer/rewards');
  return res.data;
}

export async function fetchReferrals() {
  const res = await buyerFetch<{ success: boolean; data: {
    code: string;
    inviteCount: number;
    earnings: number;
    pendingCount: number;
  } }>('/api/buyer/referrals');
  return res.data;
}
