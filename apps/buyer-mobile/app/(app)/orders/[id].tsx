import { useLocalSearchParams } from 'expo-router';
import { OrderDetailScreen } from '@/features/orders/order-detail-screen';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen orderId={id} />;
}
