import {
  dismissInstallPromptLater,
  getInstallPromptState,
  shouldShowInstallPrompt,
} from './install-prompt-state';
import { INSTALL_PROMPT_COOLDOWN_MS, PWA_STORAGE_KEYS } from './storage-keys';
import { markPwaInstalled } from './is-installed';

describe('install prompt state', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    const win = {
      matchMedia: jest.fn().mockReturnValue({ matches: false }),
    };
    Object.defineProperty(global, 'window', { configurable: true, value: win });
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
    Object.defineProperty(navigator, 'standalone', {
      configurable: true,
      value: undefined,
    });
  });

  it('hides install prompt in standalone mode', () => {
    (global.window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
    const state = getInstallPromptState();
    expect(shouldShowInstallPrompt(state)).toBe(false);
  });

  it('respects 7-day dismissal cooldown', () => {
    const now = Date.UTC(2026, 5, 1);
    dismissInstallPromptLater(now);
    const state = getInstallPromptState();

    expect(shouldShowInstallPrompt(state, now + 1000)).toBe(false);
    expect(
      shouldShowInstallPrompt(state, now + INSTALL_PROMPT_COOLDOWN_MS),
    ).toBe(true);
  });

  it('never shows again after installed flag is set', () => {
    markPwaInstalled();
    const state = getInstallPromptState();
    expect(shouldShowInstallPrompt(state)).toBe(false);
    expect(storage.get(PWA_STORAGE_KEYS.installed)).toBe('1');
  });
});
