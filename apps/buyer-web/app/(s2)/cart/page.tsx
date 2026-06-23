import { CartPageContent } from '@/features/cart/cart-page-content';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Cart — Jebdekho' };

export default function CartPage() {
  return <CartPageContent />;
}
