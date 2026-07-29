import { AuthGuard } from '@/features/auth/auth-guard';
import { CheckoutScreen } from '@/features/checkout/checkout-screen';

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutScreen />
    </AuthGuard>
  );
}
