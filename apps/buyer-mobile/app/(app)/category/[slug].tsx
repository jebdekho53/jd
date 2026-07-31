import { useLocalSearchParams } from 'expo-router';
import { CategoryDetailScreen } from '@/features/categories/category-detail-screen';

export default function CategoryDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <CategoryDetailScreen slug={slug} />;
}
