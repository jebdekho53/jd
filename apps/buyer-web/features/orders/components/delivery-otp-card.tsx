'use client';

import { ShieldCheck } from 'lucide-react';
import { useDeliveryOtpQuery } from '@/hooks/use-orders';
import type { OrderStatus } from '@/types/orders';

interface Props {
  orderId: string;
  orderStatus: OrderStatus;
}

/**
 * Shows the delivery OTP the buyer reads out to the rider at the door. The code
 * comes from an authenticated, buyer-scoped endpoint and is only rendered while
 * the server still returns it (hidden after verification / delivery / cancel).
 * The code is never persisted to storage, URLs or analytics.
 */
export function DeliveryOtpCard({ orderId, orderStatus }: Props) {
  const { data, isLoading } = useDeliveryOtpQuery(orderId, orderStatus);

  if (isLoading || !data || !data.deliveryOtp) return null;

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-brand-800">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        <h2 className="text-sm font-semibold">Delivery code</h2>
      </div>
      <p
        className="my-2 text-center text-3xl font-bold tracking-[0.5em] text-brand-900"
        aria-label={`Your delivery code is ${data.deliveryOtp.split('').join(' ')}`}
      >
        {data.deliveryOtp}
      </p>
      <p className="text-center text-xs text-muted-foreground">
        Share this code only after receiving your order.
      </p>
    </div>
  );
}
