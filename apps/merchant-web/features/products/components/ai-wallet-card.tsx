'use client';

import { useState } from 'react';
import { AlertTriangle, Wallet } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card } from '@/design-system/primitives';
import { getAiWallet } from '@/services/ai-wallet/ai-wallet-api';
import { AiWalletRechargeModal } from './ai-wallet-recharge-modal';

export function AiWalletCard() {
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const qc = useQueryClient();
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['merchant', 'ai-wallet'],
    queryFn: () => getAiWallet(),
  });

  const lowBalance =
    wallet && wallet.balancePaise < wallet.aiProductCostPaise;

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Wallet</h3>
              <p className="text-sm text-slate-500">
                ₹1.50 per AI product · Min recharge ₹100
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setRechargeOpen(true)}>
            Recharge
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-2xl font-bold text-slate-900">
              {isLoading ? '…' : `₹${(wallet?.balanceRupee ?? 0).toFixed(2)}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total spent</p>
            <p className="text-lg font-semibold text-slate-800">
              ₹{((wallet?.totalSpentPaise ?? 0) / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total recharged</p>
            <p className="text-lg font-semibold text-slate-800">
              ₹{((wallet?.totalRechargedPaise ?? 0) / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {lowBalance && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Low balance — recharge at least ₹100 to create AI products.
          </div>
        )}
      </Card>

      <AiWalletRechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        minimumRechargePaise={wallet?.minimumRechargePaise ?? 10000}
        onSuccess={() => {
          void qc.invalidateQueries({ queryKey: ['merchant', 'ai-wallet'] });
          void qc.invalidateQueries({ queryKey: ['merchant', 'ai-availability'] });
        }}
      />
    </>
  );
}
