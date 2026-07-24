/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';
const CACHE_PREFIX = `jebdekho-rider-${APP_VERSION}`;
const cacheName = (suffix: string) => `${CACHE_PREFIX}-${suffix}`;

const sameOrigin = ({ url }: { url: URL }) => url.origin === self.location.origin;

/**
 * Rider data is never cached — not the order list, not COD balances, not
 * earnings. A rider acting on a stale delivery or a stale cash figure is worse
 * than a rider seeing an error and retrying, so the service worker exists only
 * to keep the shell openable offline.
 */
const isLiveData = ({ request, url }: { request: Request; url: URL }) =>
  url.pathname.startsWith('/api/') ||
  url.pathname.startsWith('/_next/data/') ||
  url.searchParams.has('_rsc') ||
  request.headers.has('RSC') ||
  request.headers.get('Next-Router-Prefetch') === '1';

const runtimeCaching = [
  {
    matcher: (options: { request: Request; url: URL }) =>
      !isLiveData(options) &&
      sameOrigin(options) &&
      options.request.method === 'GET' &&
      options.request.destination === 'document',
    // Network-first so a deploy is picked up on the next load rather than
    // serving a stale document (and stale chunk references) behind it.
    handler: new NetworkFirst({
      cacheName: cacheName('pages'),
      networkTimeoutSeconds: 6,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24, purgeOnQuotaError: true }),
      ],
    }),
  },
  {
    matcher: (options: { request: Request; url: URL }) =>
      !isLiveData(options) &&
      sameOrigin(options) &&
      options.request.method === 'GET' &&
      /\.(?:js|css)$/i.test(options.url.pathname),
    handler: new NetworkFirst({
      cacheName: cacheName('static'),
      networkTimeoutSeconds: 6,
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 7, purgeOnQuotaError: true }),
      ],
    }),
  },
  {
    matcher: ({ request }: { request: Request }) =>
      request.method === 'GET' &&
      (request.destination === 'image' || request.destination === 'font'),
    handler: new CacheFirst({
      cacheName: cacheName('assets'),
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true }),
      ],
    }),
  },
  {
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      request.method === 'GET' && url.pathname === '/manifest.webmanifest',
    handler: new CacheFirst({
      cacheName: cacheName('manifest'),
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
    }),
  },
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
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();

// Drop caches from previous app versions so a deploy cannot leave a rider on
// last week's chunks.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('jebdekho-rider-') && !key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

interface RiderPushPayload {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: { url?: string };
}

const FALLBACK_PUSH: Required<Pick<RiderPushPayload, 'title' | 'body' | 'icon'>> = {
  title: 'JebDekho Rider',
  body: 'Open the app for an update.',
  icon: '/icon-192.png',
};

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload: RiderPushPayload = FALLBACK_PUSH;
      try {
        payload = (event.data?.json() as RiderPushPayload) ?? FALLBACK_PUSH;
      } catch {
        payload = FALLBACK_PUSH;
      }

      await self.registration.showNotification(payload.title ?? FALLBACK_PUSH.title, {
        body: payload.body ?? FALLBACK_PUSH.body,
        icon: payload.icon ?? FALLBACK_PUSH.icon,
        badge: payload.badge ?? FALLBACK_PUSH.icon,
        tag: payload.tag,
        // A delivery offer expires on a timer, so it must not auto-dismiss
        // itself off the rider's screen before they have looked at it.
        requireInteraction: payload.requireInteraction ?? false,
        data: payload.data ?? {},
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data?.url as string | undefined) ?? '/home';

  // Only ever navigate within our own origin — the URL arrives over the push
  // channel and is not otherwise validated.
  let path = '/home';
  try {
    const parsed = new URL(raw, self.location.origin);
    if (parsed.origin === self.location.origin) {
      path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    path = '/home';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          void client.focus();
          if ('navigate' in client && typeof client.navigate === 'function') {
            void client.navigate(path);
          }
          return;
        }
      }
      void self.clients.openWindow(path);
    }),
  );
});
