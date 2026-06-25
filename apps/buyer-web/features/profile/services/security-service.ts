import type { LoginSession } from '@/features/profile/types';

export async function getLoginSessions(): Promise<LoginSession[]> {
  return [
    {
      id: 'current',
      deviceName: 'This device · Buyer Web',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ];
}

export async function logoutAllDevices(): Promise<void> {
  // Future: call API to revoke all refresh tokens
}
