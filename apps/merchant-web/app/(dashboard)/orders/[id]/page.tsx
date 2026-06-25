import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OrderDetailContent } from '@/features/orders/order-detail-content';

export const metadata: Metadata = { title: 'Order Details' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <DashboardLayout title="Order Details">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading order…</p>}>
        <OrderDetailContent orderId={id} />
      </Suspense>
    </DashboardLayout>
  );
}
