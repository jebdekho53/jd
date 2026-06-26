'use client';

import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, MapPin, Package } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { ButtonLink, Spinner } from '@/design-system/primitives';
import { useOrderDetailQuery } from '@/hooks/use-orders';

function formatAddress(addr: Record<string, unknown>): string | null {
  const line1 = typeof addr.line1 === 'string' ? addr.line1 : null;
  const city = typeof addr.city === 'string' ? addr.city : null;
  const pincode = typeof addr.pincode === 'string' ? addr.pincode : null;
  if (!line1 && !city) return null;
  return [line1, city, pincode].filter(Boolean).join(', ');
}

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrderDetailQuery(id);

  return (
    <AuthGuard>
      <PageShell hideMobileNav>
        <div className="mx-auto flex max-w-md flex-col items-center py-6 text-center md:py-10">
          {isLoading ? (
            <Spinner size="lg" />
          ) : !order ? (
            <p className="text-sm text-muted-foreground">Order not found</p>
          ) : (
            <>
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
                <CheckCircle className="h-10 w-10 text-success" aria-hidden />
              </div>

              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Order placed!</h1>
              <p className="mt-1 text-sm text-muted-foreground">Order #{order.orderNumber}</p>
              <p className="mt-3 text-sm text-jd-text-secondary">
                {order.paymentMethod === 'COD'
                  ? `Pay ₹${order.totalAmount.toFixed(2)} when your order arrives.`
                  : 'Payment received. Your order is confirmed.'}
              </p>

              {order.delivery?.estimatedMins != null && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                  <Clock className="h-4 w-4" aria-hidden />
                  Estimated delivery in ~{order.delivery.estimatedMins} min
                </div>
              )}

              <div className="mt-6 w-full space-y-3 text-left">
                {formatAddress(order.deliveryAddress) && (
                  <div className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-jd-text-muted">
                        Delivering to
                      </p>
                      <p className="mt-1 text-sm text-jd-text-primary">
                        {formatAddress(order.deliveryAddress)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" aria-hidden />
                    <p className="text-sm font-semibold">{order.store.name}</p>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1.5 text-sm">
                      <span className="line-clamp-1 pr-2 text-jd-text-secondary">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium">₹{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex w-full flex-col gap-3">
                <ButtonLink href={`/orders/${order.id}/track`} fullWidth>
                  Track delivery
                </ButtonLink>
                <ButtonLink href={`/orders/${order.id}`} variant="outline" fullWidth>
                  Order details
                </ButtonLink>
                <Link href="/stores" className="text-sm font-medium text-primary hover:underline">
                  Continue shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
