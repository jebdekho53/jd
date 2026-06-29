'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, Skeleton, Table, THead, TBody, Tr, Th, Td, Button } from '@/design-system/primitives';
import { OrderStatusBadge } from './components/order-status-badge';
import { OrderPipelineBoard } from './components/order-pipeline-board';
import {
  OrderPipelineFilters,
  filtersToParams,
  type PipelineFilters,
} from './components/order-pipeline-filters';
import { OrderSlaBadge } from './components/order-sla-badge';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useStoreStore } from '@/store/store-store';
import { cn } from '@/lib/cn';

type ViewMode = 'kanban' | 'table';

const DEFAULT_FILTERS: PipelineFilters = {
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
  pipelineColumn: '',
  paymentMethod: '',
  search: '',
};

function initialFiltersFromUrl(searchParams: URLSearchParams): PipelineFilters {
  const filters: PipelineFilters = { ...DEFAULT_FILTERS };
  if (searchParams.get('today') === 'true') {
    filters.datePreset = 'today';
  }
  const status = searchParams.get('status');
  if (status === 'PAID' || status === 'PAYMENT_PENDING' || status === 'CREATED') {
    filters.pipelineColumn = 'NEW';
    filters.datePreset = 'all';
  }
  return filters;
}

export function OrdersPageContent() {
  const searchParams = useSearchParams();
  const { currentStore } = useStoreStore();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<PipelineFilters>(() =>
    initialFiltersFromUrl(searchParams),
  );

  const queryParams = filtersToParams(filters, currentStore?.id);
  const { data, isLoading, refetch, isFetching } = useOrdersQuery(queryParams);
  const orders = data?.orders ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Order Pipeline</h1>
          <p className="text-sm text-slate-500">
            {currentStore ? currentStore.name : 'All stores'} · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders/live">
            <Button variant="outline" size="sm">Live mode</Button>
          </Link>
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'rounded-md px-2 py-1.5 text-slate-600',
                viewMode === 'kanban' && 'bg-brand-50 text-brand-700',
              )}
              aria-label="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'rounded-md px-2 py-1.5 text-slate-600',
                viewMode === 'table' && 'bg-brand-50 text-brand-700',
              )}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <OrderPipelineFilters filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : viewMode === 'kanban' ? (
          <OrderPipelineBoard orders={orders} />
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>SLA</Th>
                <Th>Time</Th>
                <Th />
              </Tr>
            </THead>
            <TBody>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                  </Td>
                  <Td>
                    <p className="text-sm">{o.buyerProfile?.name ?? '—'}</p>
                    {o.buyerProfile?.phone && (
                      <p className="text-xs text-slate-400">{o.buyerProfile.phone}</p>
                    )}
                  </Td>
                  <Td>
                    <p className="max-w-xs truncate text-sm">
                      {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                    </p>
                  </Td>
                  <Td><span className="font-semibold">₹{o.totalAmount}</span></Td>
                  <Td><span className="text-xs text-slate-500">{o.paymentMethod}</span></Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td>
                    {o.operations?.sinceAcceptedMins != null && (
                      <OrderSlaBadge
                        label="Prep"
                        mins={o.operations.sinceAcceptedMins}
                        level={o.operations.prepSla}
                      />
                    )}
                  </Td>
                  <Td className="text-xs text-slate-400">
                    {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Td>
                  <Td>
                    <Link href={`/orders/${o.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
              {orders.length === 0 && (
                <Tr>
                  <Td colSpan={9} className="py-10 text-center text-slate-400">
                    No orders match your filters
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
