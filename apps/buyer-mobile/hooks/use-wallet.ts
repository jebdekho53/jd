import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyReferralCode, getReferrals, getRewards, getWallet } from '@/services/buyer-api';

export const walletKeys = {
  wallet: ['wallet', 'summary'] as const,
  rewards: ['wallet', 'rewards'] as const,
  referrals: ['wallet', 'referrals'] as const,
};

export function useWalletQuery() {
  return useQuery({ queryKey: walletKeys.wallet, queryFn: getWallet, staleTime: 30_000 });
}

export function useRewardsQuery() {
  return useQuery({ queryKey: walletKeys.rewards, queryFn: getRewards, staleTime: 30_000 });
}

export function useReferralsQuery() {
  return useQuery({ queryKey: walletKeys.referrals, queryFn: getReferrals, staleTime: 30_000 });
}

export function useApplyReferralMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => applyReferralCode(code),
    // The credit only lands once the first order completes, but the wallet
    // records the referral link immediately.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
}
