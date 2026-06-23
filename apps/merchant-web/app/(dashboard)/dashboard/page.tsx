import type { Metadata } from 'next';
import { DashboardOverviewContent } from '@/features/dashboard/dashboard-overview-content';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return <DashboardOverviewContent />;
}
