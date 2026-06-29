import {
  hasChunkRecoveryRun,
  isChunkLoadFailure,
  recoverFromChunkLoadFailure,
} from './chunk-recovery';
import { PWA_STORAGE_KEYS } from './storage-keys';

describe('chunk recovery', () => {
  const storage = new Map<string, string>();
  const localStorageMap = new Map<string, string>();
  const reload = jest.fn();
  const unregister = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    storage.clear();
    localStorageMap.clear();
    reload.mockClear();
    unregister.mockClear();

    Object.defineProperty(global, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => localStorageMap.get(key) ?? null,
        setItem: (key: string, value: string) => localStorageMap.set(key, value),
        removeItem: (key: string) => localStorageMap.delete(key),
      },
    });
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: {
        serviceWorker: {
          getRegistrations: jest.fn().mockResolvedValue([{ unregister }]),
        },
      },
    });
    Object.defineProperty(global, 'caches', {
      configurable: true,
      value: {
        keys: jest.fn().mockResolvedValue(['jebdekho-old-static-assets']),
        delete: jest.fn().mockResolvedValue(true),
      },
    });
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: {
        location: { reload },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    });
  });

  it('detects common Next.js chunk load failures', () => {
    expect(isChunkLoadFailure(new Error('Loading chunk 5721 failed.'))).toBe(true);
    expect(isChunkLoadFailure({ name: 'ChunkLoadError', message: 'missing chunk' })).toBe(true);
    expect(isChunkLoadFailure(new Error('ordinary render failure'))).toBe(false);
  });

  it('unregisters service workers, clears caches, and reloads once without touching localStorage', async () => {
    localStorageMap.set('auth-token', 'secret');
    localStorageMap.set('jebdekho:cart', '{"items":[]}');

    await expect(recoverFromChunkLoadFailure()).resolves.toBe(true);
    await expect(recoverFromChunkLoadFailure()).resolves.toBe(false);

    expect(unregister).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(hasChunkRecoveryRun()).toBe(true);
    expect(storage.get(PWA_STORAGE_KEYS.chunkRecoveryAt)).toBeTruthy();
    expect(localStorageMap.get('auth-token')).toBe('secret');
    expect(localStorageMap.get('jebdekho:cart')).toBe('{"items":[]}');
  });
});
