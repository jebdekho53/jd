import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/features/product/product-detail-screen';

export default function ProductPage() {
  const { id, store } = useLocalSearchParams<{ id: string; store?: string }>();
  return <ProductDetailScreen productId={id} storeSlug={store} />;
}
