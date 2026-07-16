'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, XCircle } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { OrderTimeline } from '@jebdekho/order-timeline';
import { useAdminOrderDetailQuery } from '@/hooks/use-order-detail';
import { cancelOrderAsAdmin } from '@/services/admin-api';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

// Mirrors the API's ADMIN_CANCELLABLE window (not once out for delivery / done).
const ADMIN_CANCELLABLE = new Set([
  'CREATED', 'PAYMENT_PENDING', 'PAID', 'MERCHANT_ACCEPTED',
  'PREPARING', 'PACKING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED',
]);

export function AdminOrderDetailContent({ orderId }: { orderId: string }) {
  const { data: order, isLoading, isError, refetch } = useAdminOrderDetailQuery(orderId);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    const reason = window.prompt('Reason for cancelling this order? (optional)') ?? undefined;
    if (!window.confirm('Cancel this order? A paid order will be refunded automatically.')) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrderAsAdmin(orderId, reason || undefined);
      await refetch();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
        {ADMIN_CANCELLABLE.has(order.status) && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
      </div>
      {cancelError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{cancelError}</p>}

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
