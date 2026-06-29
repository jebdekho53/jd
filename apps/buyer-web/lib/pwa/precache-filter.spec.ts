import { getSafePrecacheEntries, isVolatileNextAsset } from './precache-filter';

describe('precache filter', () => {
  it('keeps volatile Next.js build chunks out of service worker precache', () => {
    const entries = getSafePrecacheEntries([
      '/_next/static/chunks/webpack-old.js',
      '/_next/static/chunks/app/page-old.js',
      { url: '/_next/static/css/app-old.css', revision: 'old' },
      { url: '/offline', revision: 'current' },
      { url: '/pwa/icons/icon-192.png', revision: 'current' },
    ]);

    expect(entries).toEqual([
      { url: '/offline', revision: 'current' },
      { url: '/pwa/icons/icon-192.png', revision: 'current' },
    ]);
  });

  it('recognizes all Next.js static build assets as volatile', () => {
    expect(isVolatileNextAsset('/_next/static/chunks/main.js')).toBe(true);
    expect(isVolatileNextAsset('/_next/static/css/app.css')).toBe(true);
    expect(isVolatileNextAsset('/pwa/icons/icon-192.png')).toBe(false);
  });
});
