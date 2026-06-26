'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/site-shell';
import { EmptyState } from '@/components/common/state-blocks';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { OrderCard, OrderCardSkeleton } from '@/features/orders/components/order-card';
import { Chip } from '@/design-system/primitives';
import { useOrdersQuery } from '@/hooks/use-orders';
import type { ListOrdersParams } from '@/types/orders';

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const STATUS_FILTERS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function tabFromParams(status: string | null): FilterTab {
  if (status === 'active') return 'active';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'completed';
  return 'all';
}

export function OrdersPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<FilterTab>(() => tabFromParams(searchParams.get('status')));

  useEffect(() => {
    setTab(tabFromParams(searchParams.get('status')));
  }, [searchParams]);

  const queryParams: ListOrdersParams = useMemo(
    () => ({
      limit: 20,
      ...(tab !== 'all' && { statusGroup: tab }),
    }),
    [tab],
  );

  const { data, isLoading } = useOrdersQuery(queryParams);

  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">My orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track deliveries and view order history
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5" role="tablist" aria-label="Order status filters">
            {STATUS_FILTERS.map(({ label, value }) => (
              <Chip
                key={label}
                size="sm"
                active={tab === value}
                onClick={() => setTab(value)}
                role="tab"
                aria-selected={tab === value}
              >
                {label}
              </Chip>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : !data || data.orders.length === 0 ? (
            <EmptyState variant="orders" />
          ) : (
            <div className="space-y-3">
              {data.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}

              {data.meta.totalPages > 1 && (
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  Showing {data.orders.length} of {data.meta.total} orders
                </p>
              )}
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
