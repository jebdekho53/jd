'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, Select, Skeleton, Table, THead, TBody, Tr, Th, Td, Button } from '@/design-system/primitives';
import { OrderStatusBadge } from './components/order-status-badge';
import { useOrdersQuery } from '@/hooks/use-orders';
import { useStoreStore } from '@/store/store-store';
import type { OrderStatus } from '@/types/order';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All orders' },
  { value: 'PAID', label: 'New (Paid)' },
  { value: 'MERCHANT_ACCEPTED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY_FOR_PICKUP', label: 'Ready' },
  { value: 'CANCELLED_BY_BUYER', label: 'Cancelled' },
];

export function OrdersPageContent() {
  const { currentStore } = useStoreStore();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch, isFetching } = useOrdersQuery({
    storeId: currentStore?.id,
    status: statusFilter as OrderStatus | undefined,
  });

  const orders = data?.orders ?? [];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">
            {currentStore ? currentStore.name : 'All stores'} · Auto-refreshes every 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-56"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Order</Th>
                <Th>Items</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Time</Th>
                <Th />
              </Tr>
            </THead>
            <TBody>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                    {o.store && <p className="text-xs text-slate-400">{o.store.name}</p>}
                  </Td>
                  <Td>
                    <p className="text-sm">{o.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}</p>
                  </Td>
                  <Td><span className="font-semibold">₹{o.totalAmount}</span></Td>
                  <Td><span className="text-xs text-slate-500">{o.paymentMethod}</span></Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Td>
                  <Td>
                    <Link href={`/orders/${o.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
              {orders.length === 0 && (
                <Tr>
                  <Td colSpan={7} className="py-10 text-center text-slate-400">
                    No orders yet
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
