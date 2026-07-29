import { AuthGuard } from '@/features/auth/auth-guard';
import { ProfileEditScreen } from '@/features/profile/profile-edit-screen';

export default function ProfileEditPage() {
  return (
    <AuthGuard>
      <ProfileEditScreen />
    </AuthGuard>
  );
}
