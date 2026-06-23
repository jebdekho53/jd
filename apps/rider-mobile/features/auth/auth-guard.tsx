import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useRiderSessionQuery } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { isKycApproved, isRiderUser } from '@/types/rider';
import { Loader } from '@/components/ui/loader';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setSession, clearSession } = useAuthStore();
  const { status, data, error } = useRiderSessionQuery();

  useEffect(() => {
    if (status === 'success' && data) {
      setSession(data.user, data.profile);
      if (!isRiderUser(data.user)) {
        router.replace('/(auth)/login');
        return;
      }
      if (!isKycApproved(data.profile)) {
        router.replace('/(auth)/login?blocked=kyc');
      }
    }
    if (status === 'error') {
      clearSession();
      router.replace('/(auth)/login');
    }
  }, [status, data, error, setSession, clearSession, router]);

  if (status === 'pending') {
    return <Loader fullScreen />;
  }

  if (status === 'error' || !data || !isRiderUser(data.user) || !isKycApproved(data.profile)) {
    return <Loader fullScreen />;
  }

  return <>{children}</>;
}
