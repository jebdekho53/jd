import { use } from 'react';
import { OrderDetailContent } from '@/features/orders/order-detail-content';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order Detail — Jebdekho' };

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <OrderDetailContent orderId={id} />;
}
