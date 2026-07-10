'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import type { WishlistItem } from '@/hooks/use-wishlist';
import { ImageWithFallback } from '@/components/common/image-with-fallback';
import { formatCurrency } from '@/lib/utils';

interface WishlistProductCardProps {
  item: WishlistItem;
  onRemove: () => void;
  onMoveToCart: () => void;
  isMoving?: boolean;
}

export function WishlistProductCard({
  item,
  onRemove,
  onMoveToCart,
  isMoving,
}: WishlistProductCardProps) {
  return (
    <article className="flex gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-card">
      <Link
        href={`/products/${item.id}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-3"
      >
        <ImageWithFallback
          src={item.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="80px"
          fallback={
            <div className="flex h-full items-center justify-center">
              <Heart className="h-6 w-6 text-jd-text-muted" aria-hidden />
            </div>
          }
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/products/${item.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-jd-text-primary">{item.name}</h3>
        </Link>
        {item.storeName && (
          <p className="mt-0.5 text-xs text-jd-text-muted">{item.storeName}</p>
        )}
        <p className="mt-1 text-sm font-bold text-primary">
          {formatCurrency(item.price)}
          <span className="ml-1 text-xs font-normal text-jd-text-muted">/ {item.unit}</span>
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onMoveToCart}
            disabled={isMoving}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <ShoppingCart className="h-3 w-3" aria-hidden />
            {isMoving ? 'Adding…' : 'Move to cart'}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/5"
            aria-label={`Remove ${item.name} from wishlist`}
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
