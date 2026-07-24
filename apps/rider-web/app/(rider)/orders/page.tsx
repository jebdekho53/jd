import type { Metadata } from 'next';
import { CaptainChrome } from '@/features/rider/captain-chrome';
import { OrdersTab } from '@/features/rider/tabs/orders-tab';

export const metadata: Metadata = { title: 'Orders | JebDekho Rider' };

export default function OrdersPage() {
  return (
    <CaptainChrome>
      <OrdersTab />
    </CaptainChrome>
  );
}
