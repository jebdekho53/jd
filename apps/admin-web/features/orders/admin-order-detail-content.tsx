'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { OrderTimeline } from '@jebdekho/order-timeline';
import { useAdminOrderDetailQuery } from '@/hooks/use-order-detail';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function AdminOrderDetailContent({ orderId }: { orderId: string }) {
  const { data: order, isLoading, isError, refetch } = useAdminOrderDetailQuery(orderId);

  if (isLoading) {
    return (
      <DashboardShell title="Order Detail">
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </DashboardShell>
    );
  }

  if (isError || !order) {
    return (
      <DashboardShell title="Order Detail">
        <p className="text-sm text-red-600">Failed to load order.</p>
        <button type="button" className="mt-4 rounded border px-3 py-1.5 text-sm" onClick={() => refetch()}>
          Retry
        </button>
      </DashboardShell>
    );
  }

  const timeline = order.timeline ?? order.statusHistory ?? [];

  return (
    <DashboardShell title={`Order ${order.orderNumber}`}>
      <div className="mb-4">
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="font-semibold">Summary</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{formatStatus(order.status)}</dd>
            <dt className="text-muted-foreground">Payment</dt>
            <dd>{order.paymentMethod} / {order.paymentStatus}</dd>
            <dt className="text-muted-foreground">Buyer</dt>
            <dd>{order.buyerProfile?.name ?? '—'}</dd>
            <dt className="text-muted-foreground">Store</dt>
            <dd>{order.store?.name ?? '—'}</dd>
            <dt className="text-muted-foreground">Merchant</dt>
            <dd>{order.store?.merchant?.businessName ?? '—'}</dd>
            <dt className="text-muted-foreground">Rider</dt>
            <dd>{order.delivery?.rider?.name ?? '—'}</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd>₹{Number(order.totalAmount).toFixed(2)}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(order.createdAt).toLocaleString('en-IN')}</dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd>{new Date(order.updatedAt).toLocaleString('en-IN')}</dd>
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Timeline</h2>
          <OrderTimeline history={timeline} />
        </section>
      </div>
    </DashboardShell>
  );
}
