'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWishlist, removeWishlistItem } from '@/features/profile/services/wishlist-service';

export const wishlistKeys = {
  all: ['profile', 'wishlist'] as const,
  list: () => [...wishlistKeys.all, 'list'] as const,
};

export function useWishlistQuery() {
  const qc = useQueryClient();

  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: wishlistKeys.all });
    window.addEventListener('wishlist-change', handler);
    return () => window.removeEventListener('wishlist-change', handler);
  }, [qc]);

  return useQuery({
    queryKey: wishlistKeys.list(),
    queryFn: fetchWishlist,
    staleTime: 10_000,
  });
}

export function useRemoveWishlistItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeWishlistItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wishlistKeys.all });
      qc.invalidateQueries({ queryKey: ['profile', 'stats'] });
    },
  });
}
