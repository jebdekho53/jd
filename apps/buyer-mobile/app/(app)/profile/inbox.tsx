import { AuthGuard } from '@/features/auth/auth-guard';
import { InboxScreen } from '@/features/profile/inbox-screen';

export default function InboxPage() {
  return (
    <AuthGuard>
      <InboxScreen />
    </AuthGuard>
  );
}
