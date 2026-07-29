import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useMeQuery } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { Loader } from '@/components/ui/loader';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setSession, clearSession } = useAuthStore();
  const { status, data, error } = useMeQuery();

  useEffect(() => {
    if (status === 'success' && data) {
      setSession(data);
    }
    if (status === 'error') {
      clearSession();
      router.replace('/login');
    }
  }, [status, data, error, setSession, clearSession, router]);

  if (status === 'pending') {
    return <Loader fullScreen />;
  }

  if (status === 'error' || !data) {
    return <Loader fullScreen />;
  }

  return <>{children}</>;
}
