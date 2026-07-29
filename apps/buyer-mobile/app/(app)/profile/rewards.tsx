import { AuthGuard } from '@/features/auth/auth-guard';
import { RewardsScreen } from '@/features/wallet/rewards-screen';

export default function RewardsPage() {
  return (
    <AuthGuard>
      <RewardsScreen />
    </AuthGuard>
  );
}
