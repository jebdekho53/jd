import { getAppUrl } from '@jebdekho/web-config';

/**
 * The only rider-web routes a crawler should ever see. Everything else is
 * either behind an OTP session or a BFF proxy, so it is disallowed rather than
 * merely un-listed — an indexed /login or /cod is noise at best and a support
 * ticket at worst.
 */
export const PUBLIC_ROUTES = [
  { path: '/about', priority: 1, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/payouts', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/agreement', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/data-deletion', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
] as const;

export function riderSiteUrl(): string {
  return getAppUrl('rider').replace(/\/$/, '');
}
