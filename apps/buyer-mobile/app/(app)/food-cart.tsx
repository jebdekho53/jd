import { AuthGuard } from '@/features/auth/auth-guard';
import { FoodCartScreen } from '@/features/food/food-cart-screen';

export default function FoodCartPage() {
  return (
    <AuthGuard>
      <FoodCartScreen />
    </AuthGuard>
  );
}
