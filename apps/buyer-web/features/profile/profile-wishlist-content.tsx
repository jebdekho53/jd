'use client';

import { useRouter } from 'next/navigation';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { WishlistProductCard } from '@/features/profile/components/wishlist-product-card';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import { EmptyState } from '@/components/common/state-blocks';
import { useWishlistQuery, useRemoveWishlistItemMutation } from '@/features/profile/hooks/use-wishlist-query';
import { useToast } from '@/design-system/primitives';

export function ProfileWishlistContent() {
  const router = useRouter();
  const { data: items, isLoading, isError, refetch } = useWishlistQuery();
  const removeMutation = useRemoveWishlistItemMutation();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <ProfileShell title="Wishlist">
        <ProfileListSkeleton rows={3} />
      </ProfileShell>
    );
  }

  if (isError) {
    return (
      <ProfileShell title="Wishlist">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title="Wishlist" subtitle={`${items?.length ?? 0} saved items`}>
      {!items?.length ? (
        <EmptyState variant="wishlist" />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <WishlistProductCard
                item={item}
                onRemove={() => removeMutation.mutate(item.id)}
                onMoveToCart={() => {
                  toast('Open product to add to cart', 'info');
                  router.push(`/products/${item.id}`);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </ProfileShell>
  );
}
