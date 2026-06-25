'use client';

import { useState, useCallback } from 'react';
import { useLogoutMutation } from '@/hooks/use-auth';

export function useLogoutFlow() {
  const [open, setOpen] = useState(false);
  const logout = useLogoutMutation();

  const requestLogout = useCallback(() => setOpen(true), []);
  const cancelLogout = useCallback(() => setOpen(false), []);
  const confirmLogout = useCallback(async () => {
    await logout.mutateAsync();
    setOpen(false);
  }, [logout]);

  return {
    open,
    requestLogout,
    cancelLogout,
    confirmLogout,
    isPending: logout.isPending,
  };
}
