'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal, Button, Input } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import {
  createAiWalletRechargeOrder,
  verifyAiWalletRecharge,
} from '@/services/ai-wallet/ai-wallet-api';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  minimumRechargePaise: number;
  onSuccess?: () => void;
}

export function AiWalletRechargeModal({ open, onClose, minimumRechargePaise, onSuccess }: Props) {
  const { toast } = useToast();
  const [amountRupee, setAmountRupee] = useState(String(minimumRechargePaise / 100));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setAmountRupee(String(minimumRechargePaise / 100));
  }, [open, minimumRechargePaise]);

  const handleRecharge = useCallback(async () => {
    const amountPaise = Math.round(Number(amountRupee) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < minimumRechargePaise) {
      toast(`Minimum recharge is ₹${minimumRechargePaise / 100}`, 'error');
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast('Could not load payment gateway', 'error');
      return;
    }

    setBusy(true);
    try {
      const order = await createAiWalletRechargeOrder(amountPaise);
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'JebDekho',
        description: 'AI Wallet Recharge',
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const result = await verifyAiWalletRecharge({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast(`Recharge successful! Balance: ₹${(result.balancePaise / 100).toFixed(2)}`, 'success');
            onSuccess?.();
            onClose();
          } catch {
            toast('Payment verification failed. Contact support if amount was deducted.', 'error');
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Recharge failed', 'error');
      setBusy(false);
    }
  }, [amountRupee, minimumRechargePaise, onClose, onSuccess, toast]);

  return (
    <Modal open={open} onClose={onClose} title="Recharge AI Wallet" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Minimum recharge ₹{minimumRechargePaise / 100}. Funds are used only when you confirm an AI product.
        </p>
        <Input
          label="Amount (₹)"
          type="number"
          min={minimumRechargePaise / 100}
          value={amountRupee}
          onChange={(e) => setAmountRupee(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button loading={busy} onClick={() => void handleRecharge()}>
            Pay with Razorpay
          </Button>
        </div>
      </div>
    </Modal>
  );
}
