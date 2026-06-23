'use client';

import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { OrderTimeline } from '@/features/orders/components/order-timeline';
import { Button, Container, Skeleton, Spinner, Text } from '@/design-system/primitives';
import { useOrderDetailQuery, useCancelOrderMutation } from '@/hooks/use-orders';
import { useToast } from '@/design-system/primitives';
import { SessionError } from '@/services/auth/auth-api';

const BUYER_CANCELLABLE = new Set(['PAYMENT_PENDING', 'PAID']);

interface OrderDetailContentProps {
  orderId: string;
}

export function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const { data: order, isLoading } = useOrderDetailQuery(orderId);
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
      <div className="s2-root min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-4">
          <Container>
            <div className="flex items-center gap-3">
              <Link href="/orders" className="text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Text variant="h2" as="h1">
                Order details
              </Text>
            </div>
          </Container>
        </div>

        {isLoading ? (
          <Container className="space-y-4 py-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </Container>
        ) : !order ? (
          <Container className="flex min-h-[50vh] items-center justify-center">
            <Text variant="bodySm">Order not found</Text>
          </Container>
        ) : (
          <Container className="py-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              {/* Left */}
              <div className="space-y-4">
                {/* Status card */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text variant="caption">Order #{order.orderNumber}</Text>
                      <div className="mt-1">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <Text variant="label">₹{Number(order.totalAmount).toFixed(2)}</Text>
                      <Text variant="caption">
                        {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}
                      </Text>
                    </div>
                  </div>

                  {order.cancelReason && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Reason: {order.cancelReason}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <Text variant="label" className="mb-3 block">
                    {order.store.name}
                  </Text>
                  <div className="divide-y divide-neutral-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <Text variant="bodySm">{item.productName}</Text>
                          <Text variant="caption">
                            {item.variantName} × {item.quantity}
                          </Text>
                        </div>
                        <Text variant="bodySm">₹{Number(item.totalPrice).toFixed(2)}</Text>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3">
                    <div className="flex justify-between">
                      <Text variant="bodySm">Subtotal</Text>
                      <Text variant="bodySm">₹{Number(order.subtotal).toFixed(2)}</Text>
                    </div>
                    {Number(order.discountAmount) > 0 && (
                      <div className="flex justify-between">
                        <Text variant="bodySm">Discount</Text>
                        <Text variant="bodySm" className="text-emerald-700">
                          -₹{Number(order.discountAmount).toFixed(2)}
                        </Text>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <Text variant="bodySm">Delivery fee</Text>
                      <Text variant="bodySm">
                        {Number(order.deliveryFee) === 0
                          ? 'Free'
                          : `₹${Number(order.deliveryFee).toFixed(2)}`}
                      </Text>
                    </div>
                    <div className="flex justify-between border-t border-neutral-100 pt-2">
                      <Text variant="label">Total</Text>
                      <Text variant="label">₹{Number(order.totalAmount).toFixed(2)}</Text>
                    </div>
                  </div>
                </div>

                {/* Cancel */}
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
              </div>

              {/* Right — Timeline */}
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <Text variant="label" className="mb-4 block">
                  Order timeline
                </Text>
                {order.statusHistory.length > 0 ? (
                  <OrderTimeline history={order.statusHistory} />
                ) : (
                  <Text variant="caption">No status updates yet</Text>
                )}
              </div>
            </div>
          </Container>
        )}
      </div>
    </AuthGuard>
  );
}
