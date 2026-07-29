import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAccessToken } from '@/lib/auth/session';
import { Loader } from '@/components/ui/loader';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    })();
  }, [router]);

  return <Loader fullScreen />;
}
