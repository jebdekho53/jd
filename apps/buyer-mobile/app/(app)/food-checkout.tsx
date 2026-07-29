import { AuthGuard } from '@/features/auth/auth-guard';
import { FoodCheckoutScreen } from '@/features/food/food-checkout-screen';

export default function FoodCheckoutPage() {
  return (
    <AuthGuard>
      <FoodCheckoutScreen />
    </AuthGuard>
  );
}
