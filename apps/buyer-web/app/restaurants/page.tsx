import { createPageMetadata } from '@/lib/seo/metadata';
import { RestaurantsListingContent } from '@/features/food/restaurants-listing-content';

export const metadata = createPageMetadata({
  title: 'Restaurants near you',
  description: 'Discover restaurants, cloud kitchens and cafés delivering to your location on JebDekho.',
  path: '/restaurants',
});

export default function RestaurantsPage() {
  return <RestaurantsListingContent />;
}
