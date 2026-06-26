import type { MetadataRoute } from 'next';
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR } from '@/lib/pwa/constants';

const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 256, 384, 512] as const;

function iconEntry(size: number, purpose: 'any' | 'maskable' | 'monochrome' = 'any') {
  const suffix = purpose === 'any' ? '' : `-${purpose}`;
  return {
    src: `/pwa/icons/icon-${size}${suffix}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png' as const,
    purpose,
  };
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'JebDekho',
    short_name: 'JebDekho',
    description: 'Compare prices. Save more.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen', 'minimal-ui'],
    orientation: 'portrait',
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    lang: 'en-IN',
    dir: 'ltr',
    categories: ['shopping', 'food', 'lifestyle'],
    prefer_related_applications: false,
    icons: [
      ...ICON_SIZES.map((s) => iconEntry(s, 'any')),
      ...[192, 512].map((s) => iconEntry(s, 'maskable')),
      iconEntry(192, 'monochrome'),
    ],
    shortcuts: [
      {
        name: 'Search',
        short_name: 'Search',
        description: 'Search products and stores',
        url: '/search',
        icons: [{ src: '/pwa/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Categories',
        short_name: 'Categories',
        url: '/categories',
        icons: [{ src: '/pwa/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Offers',
        short_name: 'Offers',
        url: '/offers',
        icons: [{ src: '/pwa/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Orders',
        short_name: 'Orders',
        url: '/orders',
        icons: [{ src: '/pwa/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Cart',
        short_name: 'Cart',
        url: '/cart',
        icons: [{ src: '/pwa/icons/icon-96.png', sizes: '96x96' }],
      },
      {
        name: 'Wishlist',
        short_name: 'Wishlist',
        url: '/profile/wishlist',
        icons: [{ src: '/pwa/icons/icon-96.png', sizes: '96x96' }],
      },
    ],
    screenshots: [
      {
        src: '/pwa/screenshots/home-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Browse stores and compare prices',
      },
      {
        src: '/pwa/screenshots/home-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'JebDekho on desktop',
      },
    ],
  };
}
