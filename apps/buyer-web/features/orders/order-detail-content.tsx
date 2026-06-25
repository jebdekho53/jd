'use client';

import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/site-shell';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { RiderDeliveryPanel } from '@/features/orders/components/rider-delivery-panel';
import { DeliveryProgressTracker } from '@/features/tracking/delivery-progress-tracker';
import { useDeliveryTracking } from '@/features/tracking/use-delivery-tracking';
import { OrderTimeline } from '@jebdekho/order-timeline';
import { Button, Skeleton, Spinner } from '@/design-system/primitives';
import { useOrderDetailQuery, useCancelOrderMutation } from '@/hooks/use-orders';
import { useToast } from '@/design-system/primitives';
import { OrderReviewPanel } from '@/features/reviews/order-review-panel';
import { OrderInvoicePanel } from '@/features/orders/order-invoice-panel';
import { SessionError } from '@/services/auth/auth-api';

const BUYER_CANCELLABLE = new Set(['PAYMENT_PENDING', 'PAID']);

interface OrderDetailContentProps {
  orderId: string;
}

export function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const { data: order, isLoading } = useOrderDetailQuery(orderId);
  const { data: tracking } = useDeliveryTracking(orderId, order?.status);
  const cancelOrder = useCancelOrderMutation();
  const { toast } = useToast();

  const canCancel = order ? BUYER_CANCELLABLE.has(order.status) : false;

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder.mutateAsync({ orderId: order.id });
      toast('Order cancelled', 'success');
    } catch (err) {
      toast(err instanceof SessionError ? err.message : 'Could not cancel order', 'error');
    }
  };

  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Back to orders"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Order details</h1>
              {order && (
                <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !order ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <p className="text-sm text-muted-foreground">Order not found</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="mt-1">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{Number(order.totalAmount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}
                      </p>
                    </div>
                  </div>

                  {order.cancelReason && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>Reason: {order.cancelReason}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold">{order.store.name}</h2>
                  <div className="divide-y divide-border/60">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantName} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm">₹{Number(item.totalPrice).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{Number(order.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(order.discountAmount) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-brand-700">
                          -₹{Number(order.discountAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery fee</span>
                      <span>
                        {Number(order.deliveryFee) === 0
                          ? 'Free'
                          : `₹${Number(order.deliveryFee).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border/60 pt-2 font-semibold">
                      <span>Total</span>
                      <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {canCancel && (
                  <Button
                    variant="outline"
                    fullWidth
                    loading={cancelOrder.isPending}
                    onClick={handleCancel}
                    className="border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50"
                  >
                    Cancel order
                  </Button>
                )}

                <OrderReviewPanel
                  orderId={order.id}
                  storeName={order.store.name}
                  existing={order.review}
                  canReview={order.canReview ?? ['DELIVERED', 'COMPLETED'].includes(order.status)}
                />
              </div>

            <div className="space-y-4">
              <OrderInvoicePanel orderId={order.id} orderStatus={order.status} />

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold">Order timeline</h2>
                {(order.timeline ?? order.statusHistory).length > 0 ? (
                  <OrderTimeline history={order.timeline ?? order.statusHistory} />
                ) : (
                  <p className="text-xs text-muted-foreground">No status updates yet</p>
                )}
              </div>

              {order.delivery?.rider && (
                <>
                  {tracking && (
                    <div className="rounded-2xl border bg-card p-5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Delivery progress</h2>
                        {['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                          <Link
                            href={`/orders/${orderId}/track`}
                            className="text-xs font-medium text-brand-700 hover:underline"
                          >
                            Live map
                          </Link>
                        )}
                      </div>
                      <DeliveryProgressTracker stage={tracking.progressStage} />
                    </div>
                  )}
                  <RiderDeliveryPanel orderStatus={order.status} delivery={order.delivery} />
                </>
              )}
            </div>
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
