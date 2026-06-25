'use client';

import { useQuery } from '@tanstack/react-query';
import { Input, Text } from '@/design-system/primitives';
import { fetchWallet } from '@/services/wallet/wallet-api';
import { formatCurrency } from '@/lib/utils';

interface WalletCheckoutPanelProps {
  walletAmountToUse: number;
  rewardPointsToRedeem: number;
  onWalletChange: (amount: number) => void;
  onPointsChange: (points: number) => void;
}

export function WalletCheckoutPanel({
  walletAmountToUse,
  rewardPointsToRedeem,
  onWalletChange,
  onPointsChange,
}: WalletCheckoutPanelProps) {
  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    staleTime: 30_000,
  });

  if (!wallet) return null;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <Text variant="label">Wallet & rewards</Text>
      <p className="text-sm text-muted-foreground">
        Balance: {formatCurrency(wallet.balance)} · Points: {wallet.rewardPoints}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Use wallet (₹)"
          type="number"
          min={0}
          max={wallet.balance}
          value={walletAmountToUse || ''}
          onChange={(e) => onWalletChange(Number(e.target.value) || 0)}
        />
        <Input
          label="Redeem points"
          type="number"
          min={0}
          max={wallet.rewardPoints}
          value={rewardPointsToRedeem || ''}
          onChange={(e) => onPointsChange(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}
