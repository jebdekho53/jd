import { AuthGuard } from '@/features/auth/auth-guard';
import { SupportScreen } from '@/features/profile/support-screen';

export default function SupportPage() {
  return (
    <AuthGuard>
      <SupportScreen />
    </AuthGuard>
  );
}
