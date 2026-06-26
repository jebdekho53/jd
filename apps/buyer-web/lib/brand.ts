export const BRAND_NAME = 'JebDekho';
export const BRAND_LOGO_SRC = '/logo.svg';
export const BRAND_TAGLINE = 'Compare prices. Save more.';

const PWA_ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 256, 384, 512] as const;

export const BRAND_ICONS = {
  icon: [
    { url: '/favicon.ico', sizes: '48x48' },
    ...PWA_ICON_SIZES.map((s) => ({
      url: `/pwa/icons/icon-${s}.png`,
      sizes: `${s}x${s}`,
      type: 'image/png' as const,
    })),
  ],
  apple: [
    { url: '/pwa/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    { url: '/pwa/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
  ],
  other: [
    { rel: 'mask-icon', url: '/pwa/icons/safari-pinned-tab.svg', color: '#16a34a' },
  ],
};
