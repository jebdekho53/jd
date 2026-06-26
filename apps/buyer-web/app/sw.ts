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
import { CACHE_LIMITS } from '../lib/pwa/cache-config';
import { isPrivateApiPath, isPublicBrowsePath } from '../lib/pwa/constants';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const sameOrigin = ({ url }: { url: URL }) => url.origin === self.location.origin;

const runtimeCaching = [
  {
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      sameOrigin({ url }) &&
      request.method === 'GET' &&
      request.destination === 'document' &&
      isPublicBrowsePath(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: 'pages',
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
      cacheName: 'search-pages',
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
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      sameOrigin({ url }) &&
      request.method === 'GET' &&
      url.pathname.startsWith('/api/buyer/') &&
      !isPrivateApiPath(url.pathname),
    handler: new NetworkFirst({
      cacheName: 'api-get',
      networkTimeoutSeconds: 10,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({
          ...CACHE_LIMITS.api,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },
  {
    matcher: ({ request }: { request: Request }) =>
      request.method === 'GET' && request.destination === 'image',
    handler: new StaleWhileRevalidate({
      cacheName: 'images',
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
      cacheName: 'fonts',
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
      cacheName: 'static-assets',
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
      cacheName: 'manifest',
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string | undefined) ?? '/';
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
