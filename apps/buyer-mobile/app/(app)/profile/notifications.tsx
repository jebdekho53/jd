import { AuthGuard } from '@/features/auth/auth-guard';
import { NotificationPreferencesScreen } from '@/features/profile/notification-preferences-screen';

export default function NotificationPreferencesPage() {
  return (
    <AuthGuard>
      <NotificationPreferencesScreen />
    </AuthGuard>
  );
}
