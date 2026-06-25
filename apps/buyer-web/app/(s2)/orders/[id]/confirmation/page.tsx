'use client';

import { use } from 'react';
import { CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { ButtonLink, Spinner } from '@/design-system/primitives';
import { useOrderDetailQuery } from '@/hooks/use-orders';

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrderDetailQuery(id);

  return (
    <AuthGuard>
      <PageShell>
        <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center">
          {isLoading ? (
            <Spinner size="lg" />
          ) : !order ? (
            <p className="text-sm text-muted-foreground">Order not found</p>
          ) : (
            <>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
                <CheckCircle className="h-10 w-10 text-primary" aria-hidden />
              </div>

              <h1 className="mb-2 text-3xl font-bold tracking-tight">Order placed!</h1>
              <p className="mb-1 text-muted-foreground">Order #{order.orderNumber}</p>
              <p className="mb-8 text-sm text-muted-foreground">
                {order.paymentMethod === 'COD'
                  ? `Pay ₹${order.totalAmount.toFixed(2)} when your order arrives.`
                  : 'Payment received. Your order is confirmed.'}
              </p>

              <div className="mb-8 w-full rounded-2xl border bg-card p-5 text-left shadow-sm">
                <p className="mb-3 text-sm font-semibold">{order.store.name}</p>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1.5 text-sm">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>₹{item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-border/60 pt-3 font-semibold">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                <ButtonLink href={`/orders/${order.id}`} fullWidth>
                  Track order
                </ButtonLink>
                <ButtonLink href="/stores" variant="outline" fullWidth>
                  Continue shopping
                </ButtonLink>
              </div>
            </>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
