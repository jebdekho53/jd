import { PRODUCTION_URLS } from './index';

type RemotePattern = {
  protocol: 'https';
  hostname: string;
  pathname: string;
};

/**
 * Shared `next.config` image `remotePatterns` for apps that render uploaded
 * media. Centralised so the buyer/merchant/admin configs stay in lock-step.
 *
 *  - The canonical upload host (api.jebdekho.com) is always allowed, scoped to
 *    `/uploads/**` so it can never be used as an open image proxy.
 *  - An optional `NEXT_PUBLIC_UPLOAD_HOST` (a bare hostname, e.g. a future CDN
 *    such as `cdn.jebdekho.com`) is added only when set. This is a build-time
 *    public var by design — it is a hostname, never a secret.
 *
 * No wildcard hosts are ever emitted, so arbitrary remote image sources stay
 * blocked and Next.js image optimization keeps working through Cloudflare.
 */
export function uploadImageRemotePatterns(): RemotePattern[] {
  const canonicalHost = new URL(PRODUCTION_URLS.apiOrigin).hostname;

  const patterns: RemotePattern[] = [
    { protocol: 'https', hostname: canonicalHost, pathname: '/uploads/**' },
  ];

  const cdnHost = process.env.NEXT_PUBLIC_UPLOAD_HOST?.trim();
  if (cdnHost && cdnHost !== canonicalHost) {
    patterns.push({ protocol: 'https', hostname: cdnHost, pathname: '/**' });
  }

  return patterns;
}
