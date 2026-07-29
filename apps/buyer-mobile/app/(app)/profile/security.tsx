import { AuthGuard } from '@/features/auth/auth-guard';
import { SecurityScreen } from '@/features/profile/security-screen';

export default function SecurityPage() {
  return (
    <AuthGuard>
      <SecurityScreen />
    </AuthGuard>
  );
}
