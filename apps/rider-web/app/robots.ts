import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTES, riderSiteUrl } from '@/lib/public-routes';

export default function robots(): MetadataRoute.Robots {
  const site = riderSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_ROUTES.map((route) => route.path),
        disallow: '/',
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
