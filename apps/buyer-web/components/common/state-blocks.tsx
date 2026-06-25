import {
  AlertCircle,
  Heart,
  PackageOpen,
  Search,
  ShoppingBag,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type EmptyVariant = 'default' | 'search' | 'cart' | 'orders' | 'wishlist' | 'store';

const CONFIG: Record<
  EmptyVariant,
  { icon: typeof Search; title: string; description: string; cta?: { label: string; href: string } }
> = {
  default: {
    icon: PackageOpen,
    title: 'Nothing here yet',
    description: 'Check back soon or explore other sections.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try different keywords, browse categories, or check trending searches.',
    cta: { label: 'Browse categories', href: '/categories' },
  },
  cart: {
    icon: ShoppingBag,
    title: 'Your cart is empty',
    description: 'Add items from nearby stores to get started. Compare prices and save more.',
    cta: { label: 'Start shopping', href: '/stores' },
  },
  orders: {
    icon: PackageOpen,
    title: 'No orders yet',
    description: 'Your order history will appear here once you place your first order.',
    cta: { label: 'Browse stores', href: '/stores' },
  },
  wishlist: {
    icon: Heart,
    title: 'Wishlist is empty',
    description: 'Save products you love and come back to them anytime.',
    cta: { label: 'Discover products', href: '/search' },
  },
  store: {
    icon: Store,
    title: 'No products available',
    description: 'This store has no in-stock items in this category right now.',
    cta: { label: 'Browse other stores', href: '/stores' },
  },
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: EmptyVariant;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const cfg = CONFIG[variant];
  const Icon = cfg.icon;
  const finalTitle = title ?? cfg.title;
  const finalDesc = description ?? cfg.description;
  const ctaLabel = actionLabel ?? cfg.cta?.label;
  const ctaHref = cfg.cta?.href;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-cream-2 px-6 py-16 text-center',
        className,
      )}
      role="status"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-jd-text-primary">{finalTitle}</h3>
      <p className="mt-2 max-w-sm text-sm text-jd-text-muted">{finalDesc}</p>
      {onAction && ctaLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary btn-press"
        >
          {ctaLabel}
        </button>
      )}
      {!onAction && ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary btn-press"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center',
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-jd-text-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-jd-text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-cream-3 btn-press"
        >
          Try again
        </button>
      )}
    </div>
  );
}
