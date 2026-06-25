import { OrderTrackContent } from '@/features/tracking/order-track-content';

export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderTrackContent orderId={id} />;
}
