import {
  isDisplayModeStandalone,
  isIosStandalone,
  isPwaInstalled,
  isStandaloneLaunch,
  markPwaInstalled,
  readInstalledFlag,
} from './is-installed';
import { PWA_STORAGE_KEYS } from './storage-keys';

describe('is-installed', () => {
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
    Object.defineProperty(win, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(navigator, 'standalone', {
      configurable: true,
      value: undefined,
    });
  });

  it('detects standalone display mode', () => {
    (global.window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
    expect(isDisplayModeStandalone()).toBe(true);
    expect(isStandaloneLaunch()).toBe(true);
  });

  it('detects iOS standalone', () => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    expect(isIosStandalone()).toBe(true);
    expect(isStandaloneLaunch()).toBe(true);
  });

  it('persists installed flag when launched standalone', () => {
    (global.window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
    expect(isPwaInstalled()).toBe(true);
    expect(readInstalledFlag()).toBe(true);
    expect(storage.get(PWA_STORAGE_KEYS.installed)).toBe('1');
  });

  it('reads persisted installed flag in browser mode', () => {
    markPwaInstalled();
    expect(isPwaInstalled()).toBe(true);
  });
});
