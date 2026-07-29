import { AuthGuard } from '@/features/auth/auth-guard';
import { RestaurantsScreen } from '@/features/food/restaurants-screen';

export default function RestaurantsPage() {
  return (
    <AuthGuard>
      <RestaurantsScreen />
    </AuthGuard>
  );
}
