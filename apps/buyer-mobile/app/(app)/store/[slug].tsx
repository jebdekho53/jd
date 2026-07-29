import { useLocalSearchParams } from 'expo-router';
import { StoreScreen } from '@/features/store/store-screen';

export default function StorePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <StoreScreen slug={slug} />;
}
