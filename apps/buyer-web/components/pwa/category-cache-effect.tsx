'use client';

import { useEffect } from 'react';
import { useCategories } from '@/hooks/use-buyer-queries';
import { cacheCategories } from '@/hooks/use-cached-categories';

/** Persists category tree for offline page. */
export function CategoryCacheEffect() {
  const { data } = useCategories();

  useEffect(() => {
    if (data?.length) cacheCategories(data);
  }, [data]);

  return null;
}
