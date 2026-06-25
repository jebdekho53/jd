import type { Metadata } from 'next';
import { AdminRewardsContent } from '@/features/rewards/admin-rewards-content';

export const metadata: Metadata = { title: 'Rewards' };

export default function AdminRewardsPage() {
  return <AdminRewardsContent />;
}
