import { useLocalSearchParams } from 'expo-router';
import { AuthGuard } from '@/features/auth/auth-guard';
import { RestaurantDetailScreen } from '@/features/food/restaurant-detail-screen';

export default function RestaurantPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <AuthGuard>
      <RestaurantDetailScreen slug={slug} />
    </AuthGuard>
  );
}
