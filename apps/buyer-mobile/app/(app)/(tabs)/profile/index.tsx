import { AuthGuard } from '@/features/auth/auth-guard';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileScreen />
    </AuthGuard>
  );
}
