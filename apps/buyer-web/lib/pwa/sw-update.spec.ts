import { shouldDeletePwaCache, clearOldPwaCaches } from './cache-cleanup';
import { PWA_STORAGE_KEYS } from './storage-keys';

describe('sw-update', () => {
  const storage = new Map<string, string>();
  const cacheStore = new Map<string, unknown>();

  beforeEach(() => {
    storage.clear();
    cacheStore.clear();
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
    Object.defineProperty(global, 'caches', {
      configurable: true,
      value: {
        keys: jest.fn().mockResolvedValue([
          'pages',
          'jebdekho-0.1.0-images',
          'jebdekho-0.2.0-images',
          'workbox-precache-v2-old',
        ]),
        delete: jest.fn(async (key: string) => {
          cacheStore.delete(key);
          return true;
        }),
      },
    });
  });

  it('flags stale versioned and legacy caches for deletion', () => {
    const prefix = 'jebdekho-0.2.0';
    expect(shouldDeletePwaCache('pages', prefix)).toBe(true);
    expect(shouldDeletePwaCache('jebdekho-0.1.0-images', prefix)).toBe(true);
    expect(shouldDeletePwaCache('jebdekho-0.2.0-images', prefix)).toBe(false);
    expect(shouldDeletePwaCache('workbox-precache-v2-old', prefix, true)).toBe(true);
    expect(shouldDeletePwaCache('workbox-precache-v2-old', prefix, false)).toBe(false);
  });

  it('clears old caches without touching localStorage', async () => {
    storage.set(PWA_STORAGE_KEYS.installed, '1');
    storage.set('jebdekho:cart', '{"items":[]}');
    storage.set('auth-token', 'secret');

    const removed = await clearOldPwaCaches('0.2.0');

    expect(removed).toEqual(
      expect.arrayContaining(['pages', 'jebdekho-0.1.0-images', 'workbox-precache-v2-old']),
    );
    expect(storage.get(PWA_STORAGE_KEYS.installed)).toBe('1');
    expect(storage.get('jebdekho:cart')).toBe('{"items":[]}');
    expect(storage.get('auth-token')).toBe('secret');
  });
});
