import type { Metadata } from 'next';
import { FoodCheckoutPageContent } from '@/features/food/food-checkout-page-content';

export const metadata: Metadata = { title: 'Food checkout — JebDekho' };

export default function FoodCheckoutPage() {
  return <FoodCheckoutPageContent />;
}
