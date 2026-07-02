'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Grid3X3,
  Home,
  MapPin,
  Mic,
  Search,
  ShoppingCart,
  User,
  Package,
  Store,
  Scale,
  Map,
  BadgePercent,
  UtensilsCrossed,
} from 'lucide-react';
import { Logo, LogoLink } from '@/components/brand/logo';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { useCartQuery, useCartItemCount } from '@/hooks/use-cart';
import { useFoodCartQuery, useFoodCartItemCount } from '@/hooks/use-food-cart';
import { useAuthStore } from '@/store/auth-store';
import { useGuestCartStore } from '@/store/guest-cart-store';
import { useEffectiveLocation } from '@/store/location-store';
import { LocationPickerModal } from '@/features/location/components/location-picker-modal';
import { cn, formatCurrency } from '@/lib/utils';

function CartBadge({ className }: { className?: string }) {
  const count = useCartItemCount();
  if (count === 0) return null;
  return (
    <span
      className={cn(
        'absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-jd-text-primary',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

function FoodCartBadge({ className }: { className?: string }) {
  const count = useFoodCartItemCount();
  if (count === 0) return null;
  return (
    <span
      className={cn(
        'absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

function isFoodRoute(pathname: string): boolean {
  return (
    pathname === '/food' ||
    pathname.startsWith('/food/') ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/restaurants') ||
    pathname.startsWith('/cuisine/')
  );
}

const DESKTOP_NAV = [
  { href: '/categories', label: 'Categories', icon: Grid3X3 },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/offers', label: 'Offers', icon: BadgePercent },
  { href: '/compare', label: 'Compare', icon: Scale },
  { href: '/map', label: 'Map', icon: Map },
] as const;

function DesktopMegaNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden border-t border-border/40 md:block"
      aria-label="Browse"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
        {DESKTOP_NAV.map(({ href, label, icon: Icon }) => {
          const basePath = href.split('?')[0];
          const active = pathname === basePath || pathname.startsWith(`${basePath}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-jd-text-secondary hover:bg-muted hover:text-jd-text-primary',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { label, isReady } = useEffectiveLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const { data: cart } = useCartQuery();
  const { data: foodCart } = useFoodCartQuery();
  const cartTotal = cart?.totals.grandTotal ?? 0;
  const cartCount = cart?.itemCount ?? 0;
  const foodCartCount = foodCart?.itemCount ?? 0;
  const foodCartTotal = foodCart?.totals.grandTotal ?? 0;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-cream-1/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        {/* Desktop: single row */}
        <div className="hidden items-center gap-4 py-3 md:flex">
          <LogoLink size="md" priority />

          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="flex max-w-[200px] items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-left transition hover:border-primary/30"
            aria-label={`Deliver to ${label}. Change location.`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-jd-text-muted">
                Deliver to
              </p>
              <p
                className={cn(
                  'truncate text-xs font-semibold',
                  isReady ? 'text-jd-text-primary' : 'text-primary',
                )}
              >
                {label}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/search')}
            className="flex flex-1 items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm text-jd-text-muted shadow-card transition hover:border-primary/30 hover:shadow-elevated"
            aria-label="Search products"
          >
            <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="flex-1 text-left">Search products, brands & stores…</span>
            <Mic className="h-4 w-4 shrink-0 text-jd-text-muted" aria-hidden />
          </button>

          <Link
            href="/food/cart"
            className="relative flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 transition hover:border-primary/30"
            aria-label={`Food cart, ${foodCartCount} items`}
          >
            <UtensilsCrossed className="h-5 w-5 text-secondary" aria-hidden />
            {foodCartCount > 0 && (
              <span className="text-sm font-semibold text-jd-text-primary">
                {formatCurrency(foodCartTotal)}
              </span>
            )}
            <FoodCartBadge className="-right-1 -top-1" />
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 transition hover:border-primary/30"
            aria-label={`Grocery cart, ${cartCount} items`}
          >
            <ShoppingCart className="h-5 w-5 text-primary" aria-hidden />
            {cartCount > 0 && (
              <span className="text-sm font-semibold text-jd-text-primary">
                {formatCurrency(cartTotal)}
              </span>
            )}
            <CartBadge className="-right-1 -top-1" />
          </Link>

          <Link
            href={isAuthenticated ? '/profile' : '/login'}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary btn-press"
          >
            <User className="h-4 w-4" aria-hidden />
            {isAuthenticated ? 'Profile' : 'Login'}
          </Link>
        </div>

        {/* Mobile: stacked */}
        <div className="space-y-2 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <LogoLink size="sm" priority />
            <div className="flex items-center gap-1">
              <Link
                href="/food/cart"
                className="relative rounded-lg p-2"
                aria-label={`Food cart, ${foodCartCount} items`}
              >
                <UtensilsCrossed className="h-5 w-5 text-secondary" />
                <FoodCartBadge className="-right-0.5 -top-0.5" />
              </Link>
              <Link
                href="/cart"
                className="relative rounded-lg p-2"
                aria-label={`Grocery cart, ${cartCount} items`}
              >
                <ShoppingCart className="h-5 w-5 text-primary" />
                <CartBadge className="-right-0.5 -top-0.5" />
              </Link>
              <Link
                href={isAuthenticated ? '/profile' : '/login'}
                className="rounded-lg p-2"
                aria-label={isAuthenticated ? 'Profile' : 'Login'}
              >
                <User className="h-5 w-5 text-primary" />
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-left"
            aria-label={`Deliver to ${label}`}
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-jd-text-muted">Deliver to</p>
              <p
                className={cn(
                  'truncate text-xs font-semibold',
                  isReady ? 'text-jd-text-primary' : 'text-primary',
                )}
              >
                {label}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/search')}
            className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm text-jd-text-muted shadow-card"
            aria-label="Search products"
          >
            <Search className="h-4 w-4 text-primary" aria-hidden />
            <span className="flex-1 text-left">Search groceries…</span>
            <Mic className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <DesktopMegaNav />
    </header>

      <LocationPickerModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onConfirm={() => setLocationOpen(false)}
      />
    </>
  );
}

const MOBILE_NAV = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/categories', label: 'Categories', icon: Grid3X3 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/profile', label: 'Profile', icon: User, authAware: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around pb-safe">
        {MOBILE_NAV.map((item) => {
          const href = item.authAware && isAuthenticated ? '/profile' : item.href;
          const active = item.exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-jd-text-muted',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function FloatingCartBar() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onFoodRoute = isFoodRoute(pathname);
  const { data: cart } = useCartQuery();
  const { data: foodCart } = useFoodCartQuery();
  const guestItems = useGuestCartStore((s) => s.items);
  const guestCount = useGuestCartStore((s) => s.itemCount());
  const guestSubtotal = guestItems.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0);

  if (onFoodRoute) {
    const foodCount = foodCart?.itemCount ?? 0;
    const foodTotal = foodCart?.totals.grandTotal ?? 0;
    if (
      foodCount === 0 ||
      pathname === '/food/cart' ||
      pathname === '/food/checkout'
    ) {
      return null;
    }
    return (
      <Link
        href="/food/cart"
        className="fixed bottom-20 left-4 right-4 z-30 mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-white shadow-float transition hover:bg-primary md:bottom-6 md:left-auto md:right-6 md:max-w-xs btn-press"
        aria-label={`View food cart, ${foodCount} items, ${formatCurrency(foodTotal)}`}
      >
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" aria-hidden />
          <span className="text-sm font-semibold">
            {foodCount} item{foodCount !== 1 ? 's' : ''} · {formatCurrency(foodTotal)}
          </span>
        </div>
        <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold">View cart</span>
      </Link>
    );
  }

  const count = isAuthenticated ? (cart?.itemCount ?? 0) : guestCount;
  const total = isAuthenticated ? (cart?.totals.grandTotal ?? 0) : guestSubtotal;

  if (count === 0 || pathname === '/cart' || pathname === '/checkout') return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 left-4 right-4 z-30 mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-primary px-4 py-3 text-white shadow-float transition hover:bg-secondary md:bottom-6 md:left-auto md:right-6 md:max-w-xs btn-press"
      aria-label={`View cart, ${count} items, ${formatCurrency(total)}`}
    >
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" aria-hidden />
        <span className="text-sm font-semibold">
          {count} item{count !== 1 ? 's' : ''} · {formatCurrency(total)}
        </span>
      </div>
      <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-semibold">View cart</span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border/50 bg-cream-4" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4">
            <Logo size="sm" />
            <p className="mt-2 text-sm text-jd-text-muted">{BRAND_TAGLINE}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-jd-text-primary">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-jd-text-muted">
              <li><Link href="/about" className="hover:text-primary">About JebDekho</Link></li>
              <li><Link href="/help" className="hover:text-primary">Help center</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-jd-text-primary">Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-jd-text-muted">
              <li><Link href="/faq" className="hover:text-primary">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact support</Link></li>
              <li><Link href="/orders" className="hover:text-primary">Track order</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-jd-text-primary">Policies</h3>
            <ul className="mt-3 space-y-2 text-sm text-jd-text-muted">
              <li><Link href="/terms" className="hover:text-primary">Terms of service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">Privacy policy</Link></li>
              <li><Link href="/data-deletion" className="hover:text-primary">Data deletion</Link></li>
              <li><Link href="/refund-policy" className="hover:text-primary">Refund policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-jd-text-primary">Connect</h3>
            <ul className="mt-3 space-y-2 text-sm text-jd-text-muted">
              <li><span>support@jebdekho.com</span></li>
              <li><span>Twitter · Instagram</span></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-jd-text-muted">
          © {new Date().getFullYear()} {BRAND_NAME}. {BRAND_TAGLINE}
        </p>
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  className,
  hideFooter = false,
  hideMobileNav = false,
  hideFloatingCart = false,
}: {
  children: React.ReactNode;
  className?: string;
  hideFooter?: boolean;
  hideMobileNav?: boolean;
  hideFloatingCart?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main
        className={cn(
          'mx-auto w-full max-w-6xl flex-1 px-4 pt-4 md:pt-6',
          hideMobileNav ? 'pb-6 md:pb-8' : 'pb-28 md:pb-8',
          className,
        )}
      >
        {children}
      </main>
      {!hideFooter && <SiteFooter />}
      {!hideFloatingCart && <FloatingCartBar />}
      {!hideMobileNav && <MobileBottomNav />}
    </div>
  );
}
