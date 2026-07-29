import { AuthGuard } from '@/features/auth/auth-guard';
import { PlusScreen } from '@/features/plus/plus-screen';

export default function PlusPage() {
  return (
    <AuthGuard>
      <PlusScreen />
    </AuthGuard>
  );
}
