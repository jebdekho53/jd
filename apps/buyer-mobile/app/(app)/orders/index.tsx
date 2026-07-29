import { AuthGuard } from '@/features/auth/auth-guard';
import { OrdersListScreen } from '@/features/orders/orders-list-screen';

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersListScreen />
    </AuthGuard>
  );
}
