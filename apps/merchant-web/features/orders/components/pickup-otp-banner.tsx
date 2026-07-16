'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { getPickupOtp } from '@/services/orders/orders-api';
import { isPickupOtpVisible } from '@/lib/orders/pickup-otp-visibility';

interface Props {
  orderId: string;
  deliveryStatus: string;
}

/**
 * Shows the pickup/handover OTP the merchant reads out to the rider. Fetched from
 * an authenticated, store-scoped endpoint; the server returns null once pickup is
 * verified or the delivery is terminal, so the banner self-hides. Never rendered
 * in list views and never persisted to storage/analytics.
 */
export function PickupOtpBanner({ orderId, deliveryStatus }: Props) {
  const active = isPickupOtpVisible(deliveryStatus);
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'order', orderId, 'pickup-otp'],
    queryFn: () => getPickupOtp(orderId),
    enabled: Boolean(orderId) && active,
    staleTime: 15_000,
    refetchInterval: active ? 30_000 : false,
  });

  if (isLoading || !data || !data.pickupOtp) return null;

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
      <div className="mb-1 flex items-center gap-2 text-brand-800">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide">Pickup code</p>
      </div>
      <p
        className="text-center text-2xl font-bold tracking-[0.4em] text-brand-900"
        aria-label={`Pickup code ${data.pickupOtp.split('').join(' ')}`}
      >
        {data.pickupOtp}
      </p>
      <p className="mt-1 text-center text-xs text-slate-500">
        Share this code only after checking the rider and package.
      </p>
    </div>
  );
}
