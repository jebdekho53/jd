import { createPageMetadata } from '@/lib/seo/metadata';
import { FoodHomeContent } from '@/features/food/food-home-content';

export const metadata = createPageMetadata({
  title: 'Food delivery near you',
  description: 'Order from restaurants, cloud kitchens and cafés with fast delivery on JebDekho.',
  path: '/food',
});

export default function FoodPage() {
  return <FoodHomeContent />;
}
