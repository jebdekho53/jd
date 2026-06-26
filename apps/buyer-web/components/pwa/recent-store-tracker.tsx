'use client';

import { useEffect } from 'react';
import { trackRecentStore } from '@/hooks/use-recent-stores';

interface Props {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export function RecentStoreTracker({ id, name, slug, imageUrl }: Props) {
  useEffect(() => {
    trackRecentStore({ id, name, slug, imageUrl: imageUrl ?? null });
  }, [id, name, slug, imageUrl]);

  return null;
}
