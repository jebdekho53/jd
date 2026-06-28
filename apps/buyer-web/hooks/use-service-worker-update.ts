'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyPwaUpdate,
  clearUpdatePendingFlag,
  hasWaitingServiceWorker,
} from '@/lib/pwa/sw-update';
import { registerServiceWorker } from '@/lib/pwa/register-sw';

export interface UseServiceWorkerUpdateResult {
  updateAvailable: boolean;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateResult {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    clearUpdatePendingFlag();

    const checkWaiting = async () => {
      const waiting = await hasWaitingServiceWorker();
      if (waiting) setUpdateAvailable(true);
    };

    void checkWaiting();

    let removeUpdateFound: (() => void) | undefined;

    void registerServiceWorker().then((reg) => {
      if (!reg) return;

      const onUpdateFound = () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      };

      reg.addEventListener('updatefound', onUpdateFound);
      removeUpdateFound = () => reg.removeEventListener('updatefound', onUpdateFound);
    });

    return () => {
      removeUpdateFound?.();
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    try {
      await applyPwaUpdate();
    } catch {
      clearUpdatePendingFlag();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
