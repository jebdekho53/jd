import { AuthGuard } from '@/features/auth/auth-guard';
import { SettingsScreen } from '@/features/profile/settings-screen';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsScreen />
    </AuthGuard>
  );
}
