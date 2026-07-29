import { useLocalSearchParams } from 'expo-router';
import { RestaurantDetailScreen } from '@/features/food/restaurant-detail-screen';

export default function RestaurantPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <RestaurantDetailScreen slug={slug} />;
}
