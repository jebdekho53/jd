import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Loader } from '@/components/ui/loader';

/** Guests and signed-in users both land on /home — browsing never requires
 *  login. Screens that do (checkout, orders, profile, ...) gate themselves
 *  via AuthGuard and redirect to /login only when actually needed. */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return <Loader fullScreen />;
}
