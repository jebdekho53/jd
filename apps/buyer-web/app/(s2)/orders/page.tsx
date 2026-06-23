import { OrdersPageContent } from '@/features/orders/orders-page-content';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Orders — Jebdekho' };

export default function OrdersPage() {
  return <OrdersPageContent />;
}
