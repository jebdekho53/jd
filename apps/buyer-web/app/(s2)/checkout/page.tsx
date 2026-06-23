import { CheckoutPageContent } from '@/features/checkout/checkout-page-content';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Checkout — Jebdekho' };

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
