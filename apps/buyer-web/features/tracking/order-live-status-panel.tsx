'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  getOrderStatusStageIndex,
  ORDER_STATUS_STAGES,
} from '@/lib/tracking/order-status-stage';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus, PaymentMethod } from '@/types/orders';

interface OrderLiveStatusPanelProps {
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  totalAmount?: number;
  className?: string;
}

export function OrderLiveStatusPanel({
  status,
  paymentMethod,
  totalAmount,
  className,
}: OrderLiveStatusPanelProps) {
  const currentIdx = getOrderStatusStageIndex(status);

  return (
    <div className={`rounded-2xl border bg-card p-5 shadow-sm ${className ?? ''}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Order status</h2>
        {paymentMethod === 'COD' && totalAmount != null && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
            Pay {formatCurrency(totalAmount)} on delivery
          </span>
        )}
      </div>

      <div className="space-y-0">
        {ORDER_STATUS_STAGES.map((stage, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const upcoming = idx > currentIdx;

          return (
            <div key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    done
                      ? 'bg-brand-600 text-white'
                      : active
                        ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                {idx < ORDER_STATUS_STAGES.length - 1 && (
                  <div className={`my-1 h-6 w-0.5 ${done ? 'bg-brand-500' : 'bg-border'}`} />
                )}
              </div>
              <div className={`pb-4 pt-1 ${upcoming ? 'opacity-50' : ''}`}>
                <p
                  className={`text-sm ${
                    active ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stage.label}
                </p>
                {active && !done && (
                  <p className="text-xs text-brand-600">In progress</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
