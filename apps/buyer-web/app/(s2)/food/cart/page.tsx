import type { Metadata } from 'next';
import { FoodCartPageContent } from '@/features/food/food-cart-page-content';

export const metadata: Metadata = { title: 'Food cart — JebDekho' };

export default function FoodCartPage() {
  return <FoodCartPageContent />;
}
