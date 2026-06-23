'use client';

import { use } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { ButtonLink, Container, Spinner, Text } from '@/design-system/primitives';
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
      <div className="s2-root min-h-screen bg-neutral-50">
        <Container size="sm" className="flex min-h-screen flex-col items-center justify-center py-12 text-center">
          {isLoading ? (
            <Spinner size="lg" />
          ) : !order ? (
            <Text variant="bodySm">Order not found</Text>
          ) : (
            <>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>

              <Text variant="display" as="h1" className="mb-2">
                Order placed!
              </Text>
              <Text variant="body" className="mb-1 text-neutral-600">
                Order #{order.orderNumber}
              </Text>
              <Text variant="bodySm" className="mb-8">
                {order.paymentMethod === 'COD'
                  ? 'Pay ₹' + order.totalAmount.toFixed(2) + ' when your order arrives.'
                  : 'Payment received. Your order is confirmed.'}
              </Text>

              <div className="mb-8 w-full rounded-xl bg-white p-5 text-left shadow-sm">
                <Text variant="label" className="mb-3 block">
                  {order.store.name}
                </Text>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1.5">
                    <Text variant="bodySm">
                      {item.productName} × {item.quantity}
                    </Text>
                    <Text variant="bodySm">₹{item.totalPrice.toFixed(2)}</Text>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3">
                  <Text variant="label">Total</Text>
                  <Text variant="label">₹{order.totalAmount.toFixed(2)}</Text>
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
        </Container>
      </div>
    </AuthGuard>
  );
}
