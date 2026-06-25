import type { Metadata } from 'next';
import { AdminOrderDetailContent } from '@/features/orders/admin-order-detail-content';

export const metadata: Metadata = { title: 'Order Details' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOrderDetailContent orderId={id} />;
}
