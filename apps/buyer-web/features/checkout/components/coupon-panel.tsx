'use client';

import { useState } from 'react';
import { Button } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import { useQueryClient } from '@tanstack/react-query';
import { applyCoupon, removeCoupon, validateCoupon } from '@/services/promotions/promotions-api';
import type { Cart } from '@/types/cart';

interface CouponPanelProps {
  cart: Cart;
}

export function CouponPanel({ cart }: CouponPanelProps) {
  const [code, setCode] = useState(cart.appliedCouponCode ?? '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const applied = Boolean(cart.totals.promo?.appliedCoupon);

  const refresh = () => qc.invalidateQueries({ queryKey: ['cart'] });

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const validation = await validateCoupon(code.trim());
      if (!validation.valid) {
        toast(validation.message ?? 'Invalid coupon', 'error');
        return;
      }
      await applyCoupon(code.trim());
      toast('Coupon applied', 'success');
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not apply coupon', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeCoupon();
      setCode('');
      toast('Coupon removed', 'success');
      refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <p className="text-sm font-semibold">Have a coupon?</p>
      {applied ? (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
          <span className="text-sm font-mono font-medium text-emerald-800">
            {cart.totals.promo?.appliedCoupon?.code}
          </span>
          <Button size="sm" variant="outline" onClick={handleRemove} disabled={loading}>
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm uppercase"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button onClick={handleApply} disabled={loading}>
            Apply
          </Button>
        </div>
      )}
      {cart.totals.promo?.appliedPromotion && (
        <p className="text-xs text-slate-500">
          Store offer applied: {cart.totals.promo.appliedPromotion.name}
        </p>
      )}
      {(cart.totals.couponDiscount ?? 0) > 0 && (
        <p className="text-sm text-emerald-700">
          Coupon savings: ₹{cart.totals.couponDiscount!.toFixed(2)}
        </p>
      )}
      {(cart.totals.offerDiscount ?? 0) > 0 && (
        <p className="text-sm text-emerald-700">
          Offer savings: ₹{cart.totals.offerDiscount!.toFixed(2)}
        </p>
      )}
    </div>
  );
}
