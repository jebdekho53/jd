'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAddressStore } from '@/store/address-store';
import { listAddressesRemote } from '@/services/addresses/address-api';

/**
 * Keeps the local address-book cache (useAddressStore) in sync with the
 * server's per-user address book: fetches and hydrates on login, clears on
 * logout. Without this, the cache used to persist across accounts on a
 * shared browser/device — this account's saved addresses could silently
 * carry over into whoever logged in next. Renders nothing.
 */
export function AddressBookSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const userId = useAuthStore((s) => s.user?.id);
  const hydrate = useAddressStore((s) => s.hydrate);
  const reset = useAddressStore((s) => s.reset);
  const lastHydratedUserId = useRef<string | null>(null);

  useEffect(() => {
    // One-time cleanup: the address store used to be persist()-ed under this
    // key before addresses moved to the real per-user backend. Old browsers
    // may still be carrying that stale, unscoped snapshot around — remove it
    // so it can never be read by anything again.
    try {
      localStorage.removeItem('jebdekho-addresses');
    } catch {
      // ignore (e.g. storage disabled)
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !userId) {
      if (lastHydratedUserId.current !== null) {
        reset();
        lastHydratedUserId.current = null;
      }
      return;
    }

    if (lastHydratedUserId.current === userId) return;
    lastHydratedUserId.current = userId;

    listAddressesRemote()
      .then(hydrate)
      .catch(() => {
        // Non-fatal — checkout/profile still work with an empty address book
        // and the buyer can add a fresh one; next successful fetch retries.
        lastHydratedUserId.current = null;
      });
  }, [authLoading, isAuthenticated, userId, hydrate, reset]);

  return null;
}
