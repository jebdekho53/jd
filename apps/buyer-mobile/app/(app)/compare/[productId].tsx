import { useLocalSearchParams } from 'expo-router';
import { CompareScreen } from '@/features/compare/compare-screen';

export default function ComparePage() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  return <CompareScreen productId={productId} />;
}
