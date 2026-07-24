import type { MetadataRoute } from 'next';
import { PUBLIC_ROUTES, riderSiteUrl } from '@/lib/public-routes';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = riderSiteUrl();
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `${site}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
