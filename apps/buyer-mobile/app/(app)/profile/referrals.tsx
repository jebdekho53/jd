import { AuthGuard } from '@/features/auth/auth-guard';
import { ReferralsScreen } from '@/features/wallet/referrals-screen';

export default function ReferralsPage() {
  return (
    <AuthGuard>
      <ReferralsScreen />
    </AuthGuard>
  );
}
