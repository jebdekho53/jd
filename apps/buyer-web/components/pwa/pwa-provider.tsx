'use client';

import { useEffect } from 'react';
import { flushSyncQueue } from '@/lib/pwa/background-sync/queue';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { CategoryCacheEffect } from '@/components/pwa/category-cache-effect';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { UpdateToast } from '@/components/pwa/update-toast';

async function flushQueues() {
  await flushSyncQueue({});
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    void registerServiceWorker();

    const onOnline = () => void flushQueues();
    window.addEventListener('online', onOnline);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FLUSH_SYNC_QUEUE') void flushQueues();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <>
      {children}
      <CategoryCacheEffect />
      <InstallPrompt />
      <UpdateToast />
    </>
  );
}
