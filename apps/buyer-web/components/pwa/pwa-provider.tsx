'use client';

import { useEffect } from 'react';
import { flushSyncQueue } from '@/lib/pwa/background-sync/queue';
import { registerServiceWorker } from '@/lib/pwa/register-sw';
import { CategoryCacheEffect } from '@/components/pwa/category-cache-effect';
import { LocationBootstrap } from '@/components/location/location-bootstrap';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { UpdateAvailableToast } from '@/components/pwa/update-available-toast';
import { PushAfterInstallPrompt } from '@/components/pwa/push-after-install-prompt';
import { useServiceWorkerUpdate } from '@/hooks/use-service-worker-update';
import { installChunkLoadRecovery } from '@/lib/pwa/chunk-recovery';

async function flushQueues() {
  await flushSyncQueue({});
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    void registerServiceWorker();
    const removeChunkRecovery = installChunkLoadRecovery();

    const onOnline = () => void flushQueues();
    window.addEventListener('online', onOnline);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'FLUSH_SYNC_QUEUE') void flushQueues();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);

    return () => {
      removeChunkRecovery();
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <>
      {children}
      <LocationBootstrap />
      <CategoryCacheEffect />
      <InstallPrompt blockedByUpdate={updateAvailable} />
      <UpdateAvailableToast
        updateAvailable={updateAvailable}
        onApply={applyUpdate}
        onDismiss={dismissUpdate}
      />
      <PushAfterInstallPrompt />
    </>
  );
}
