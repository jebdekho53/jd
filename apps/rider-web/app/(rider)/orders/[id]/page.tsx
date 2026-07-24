import type { Metadata } from 'next';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { OrderDetail } from '@/features/rider/order-detail';

export const metadata: Metadata = { title: 'Delivery | JebDekho Rider' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CaptainChrome>
      <OrderDetail orderId={id} />
    </CaptainChrome>
  );
}
