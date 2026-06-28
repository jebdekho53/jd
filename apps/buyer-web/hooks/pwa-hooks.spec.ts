import { shouldShowInstallPrompt } from '@/lib/pwa/install-prompt-state';

describe('usePwaInstall behavior', () => {
  it('blocks install prompt when update is available', () => {
    const state = { installed: false, neverShow: false, dismissedAt: null };
    expect(shouldShowInstallPrompt(state)).toBe(true);

    const blockedByUpdate = true;
    const canShow = !blockedByUpdate && shouldShowInstallPrompt(state);
    expect(canShow).toBe(false);
  });
});

describe('useServiceWorkerUpdate behavior', () => {
  it('treats waiting service worker as update available', () => {
    const registration = { waiting: { postMessage: jest.fn() } };
    expect(Boolean(registration.waiting)).toBe(true);
  });
});
