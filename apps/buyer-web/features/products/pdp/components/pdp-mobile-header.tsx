'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Share2, ShoppingCart, Check } from 'lucide-react';
import { useCartItemCount } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

interface PdpMobileHeaderProps {
  title: string;
  onShare: () => void;
  shared?: boolean;
  className?: string;
}

export function PdpMobileHeader({ title, onShare, shared, className }: PdpMobileHeaderProps) {
  const router = useRouter();
  const cartCount = useCartItemCount();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 -mx-4 flex items-center gap-2 border-b border-border/60 bg-cream-1/95 px-3 py-2.5 backdrop-blur-md lg:hidden',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-card"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5 text-jd-text-primary" />
      </button>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-jd-text-primary">{title}</p>
      <Link
        href="/search"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-card"
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-jd-text-muted" />
      </Link>
      <button
        type="button"
        onClick={onShare}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-card"
        aria-label={shared ? 'Link copied' : 'Share product'}
      >
        {shared ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Share2 className="h-4 w-4 text-jd-text-muted" />
        )}
      </button>
      <Link
        href="/cart"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-card"
        aria-label={`Cart, ${cartCount} items`}
      >
        <ShoppingCart className="h-4 w-4 text-jd-text-muted" />
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-jd-text-primary">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </Link>
    </header>
  );
}
