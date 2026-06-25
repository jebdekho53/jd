import { OffersPageContent } from '@/features/offers/offers-page-content';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Deals & offers',
  description: 'Best deals and discounts on groceries from nearby stores.',
  path: '/offers',
});

export default function OffersPage() {
  return <OffersPageContent />;
}
