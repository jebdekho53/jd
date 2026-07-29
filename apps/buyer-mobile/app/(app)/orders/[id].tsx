import { useLocalSearchParams } from 'expo-router';
import { AuthGuard } from '@/features/auth/auth-guard';
import { OrderDetailScreen } from '@/features/orders/order-detail-screen';

export default function OrderDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AuthGuard>
      <OrderDetailScreen orderId={id} />
    </AuthGuard>
  );
}
