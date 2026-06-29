/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';
import { CACHE_LIMITS, runtimeCacheName } from '../lib/pwa/cache-config';
import { isPublicBrowsePath } from '../lib/pwa/constants';
import { shouldDeletePwaCache } from '../lib/pwa/cache-cleanup';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';
const CACHE_PREFIX = `jebdekho-${APP_VERSION}`;
const cacheName = (suffix: string) => runtimeCacheName(suffix, APP_VERSION);

const sameOrigin = ({ url }: { url: URL }) => url.origin === self.location.origin;

const runtimeCaching = [
  {
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      sameOrigin({ url }) &&
      request.method === 'GET' &&
      request.destination === 'document' &&
      isPublicBrowsePath(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: cacheName('pages'),
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          ...CACHE_LIMITS.pages,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },
  {
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      sameOrigin({ url }) &&
      request.method === 'GET' &&
      url.pathname.startsWith('/search'),
    handler: new NetworkFirst({
      cacheName: cacheName('search-pages'),
      networkTimeoutSeconds: 8,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          ...CACHE_LIMITS.search,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },
  {
    matcher: ({ request }: { request: Request }) =>
      request.method === 'GET' && request.destination === 'image',
    handler: new StaleWhileRevalidate({
      cacheName: cacheName('images'),
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          ...CACHE_LIMITS.images,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },
  {
    matcher: ({ request }: { request: Request }) =>
      request.method === 'GET' &&
      (request.destination === 'font' || /\.(?:woff2?|ttf|otf)$/i.test(request.url)),
    handler: new CacheFirst({
      cacheName: cacheName('fonts'),
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          ...CACHE_LIMITS.fonts,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },
  {
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      sameOrigin({ url }) &&
      request.method === 'GET' &&
      /\.(?:js|css)$/i.test(url.pathname),
    handler: new CacheFirst({
      cacheName: cacheName('static-assets'),
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          ...CACHE_LIMITS.static,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },
  {
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      sameOrigin({ url }) &&
      request.method === 'GET' &&
      (url.pathname === '/manifest.webmanifest' ||
        url.pathname.endsWith('manifest.json')),
    handler: new CacheFirst({
      cacheName: cacheName('manifest'),
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => shouldDeletePwaCache(key, CACHE_PREFIX, false))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const fallback = {
        title: 'JebDekho',
        body: 'You have a new update.',
        icon: '/pwa/icons/icon-192.png',
        badge: '/pwa/icons/icon-72.png',
        data: { url: '/' },
      };

      let payload: {
        title?: string;
        body?: string;
        icon?: string;
        badge?: string;
        image?: string;
        tag?: string;
        data?: { url?: string };
      } = fallback;
      try {
        payload = event.data?.json() ?? fallback;
      } catch {
        payload = fallback;
      }

      const options: NotificationOptions = {
        body: payload.body ?? fallback.body,
        icon: payload.icon ?? fallback.icon,
        badge: payload.badge ?? fallback.badge,
        tag: payload.tag,
        data: payload.data ?? fallback.data,
      };
      if (payload.image) {
        (options as NotificationOptions & { image?: string }).image = payload.image;
      }

      await self.registration.showNotification(payload.title ?? fallback.title, options);
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data?.url as string | undefined) ?? '/';
  let url = '/';
  try {
    const parsed = new URL(rawUrl, self.location.origin);
    if (parsed.origin === self.location.origin) {
      url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    url = '/';
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          void client.focus();
          if ('navigate' in client && typeof client.navigate === 'function') {
            void client.navigate(url);
          }
          return;
        }
      }
      void self.clients.openWindow(url);
    }),
  );
});

const SYNC_HANDLERS = ['wishlist', 'cart', 'search-history', 'analytics'] as const;

self.addEventListener('sync', (event: ExtendableEvent & { tag?: string }) => {
  const tag = event.tag;
  if (SYNC_HANDLERS.some((k) => tag === `jebdekho-${k}`)) {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'FLUSH_SYNC_QUEUE', tag }));
      }),
    );
  }
});
