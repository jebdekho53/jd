'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { OrderCard, OrderCardSkeleton } from '@/features/orders/components/order-card';
import { ButtonLink, Container, Text } from '@/design-system/primitives';
import { useOrdersQuery } from '@/hooks/use-orders';
import type { OrderStatus } from '@/types/orders';

const STATUS_FILTERS: { label: string; value: OrderStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'MERCHANT_ACCEPTED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED_BY_BUYER' },
];

export function OrdersPageContent() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus | undefined>(undefined);
  const { data, isLoading, refetch } = useOrdersQuery({
    status: activeStatus,
    limit: 20,
  });

  return (
    <AuthGuard>
      <div className="s2-root min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-4">
          <Container>
            <Text variant="h2" as="h1">
              My orders
            </Text>
          </Container>
        </div>

        {/* Status filter tabs */}
        <div className="sticky top-[57px] z-10 border-b border-neutral-100 bg-white">
          <Container>
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
              {STATUS_FILTERS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveStatus(value)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeStatus === value
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Container>
        </div>

        <Container className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : !data || data.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <Package className="h-8 w-8 text-neutral-400" />
              </div>
              <Text variant="h2" className="mb-2">
                No orders yet
              </Text>
              <Text variant="bodySm" className="mb-8">
                {activeStatus
                  ? 'No orders with this status'
                  : 'Your orders will appear here once you start shopping'}
              </Text>
              <ButtonLink href="/stores" variant="outline">
                Browse stores
              </ButtonLink>
            </div>
          ) : (
            <div className="space-y-3">
              {data.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}

              {data.meta.totalPages > 1 && (
                <div className="pt-4 text-center">
                  <Text variant="caption">
                    Showing {data.orders.length} of {data.meta.total} orders
                  </Text>
                </div>
              )}
            </div>
          )}
        </Container>
      </div>
    </AuthGuard>
  );
}
