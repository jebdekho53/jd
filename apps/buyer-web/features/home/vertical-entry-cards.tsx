'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Coffee, Croissant, Leaf, ShoppingBasket, UtensilsCrossed } from 'lucide-react';
import { resolveCategoryImage } from '@/lib/category-images';
import { cn } from '@/lib/utils';

interface EntryCard {
  label: string;
  sub: string;
  href: string;
  imageSlug: string;
  icon: typeof ShoppingBasket;
  className: string;
  iconClassName: string;
}

/**
 * Swiggy/Blinkit-style vertical entry cards. Gives the home a clear
 * "pick a world first" split (Grocery / Food / Bakery / Cafe / Fresh) instead
 * of one mixed feed.
 */
const CARDS: EntryCard[] = [
  {
    label: 'Grocery',
    sub: 'Instant everyday essentials',
    href: '/',
    imageSlug: 'grocery',
    icon: ShoppingBasket,
    className: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-lime-50',
    iconClassName: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Food',
    sub: 'From nearby restaurants',
    href: '/food',
    imageSlug: 'food',
    icon: UtensilsCrossed,
    className: 'border-orange-200/70 bg-gradient-to-br from-orange-50 to-amber-50',
    iconClassName: 'bg-orange-100 text-orange-700',
  },
  {
    label: 'Bakery',
    sub: 'Fresh bakes & cakes',
    href: '/?vertical=bakery',
    imageSlug: 'bakery',
    icon: Croissant,
    className: 'border-rose-200/70 bg-gradient-to-br from-rose-50 to-pink-50',
    iconClassName: 'bg-rose-100 text-rose-700',
  },
  {
    label: 'Cafe',
    sub: 'Coffee & quick bites',
    href: '/?vertical=cafe',
    imageSlug: 'cafe',
    icon: Coffee,
    className: 'border-amber-200/70 bg-gradient-to-br from-amber-50 to-yellow-50',
    iconClassName: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Fresh',
    sub: 'Fruits & vegetables',
    href: '/?vertical=fresh',
    imageSlug: 'fruits-vegetables',
    icon: Leaf,
    className: 'border-teal-200/70 bg-gradient-to-br from-teal-50 to-emerald-50',
    iconClassName: 'bg-teal-100 text-teal-700',
  },
];

export function VerticalEntryCards({ className }: { className?: string }) {
  return (
    <section aria-label="Shop by category" className={className}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CARDS.map(({ label, sub, href, imageSlug, icon: Icon, className: cardClass, iconClassName }) => {
          const image = resolveCategoryImage({ name: label, slug: imageSlug, imageUrl: null });

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'group flex flex-col justify-between rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop',
                cardClass,
              )}
            >
              <span className={cn('relative grid aspect-square w-11 place-items-center overflow-hidden rounded-2xl', iconClassName)}>
                {image ? (
                  <Image src={image} alt="" fill className="object-contain p-1.5" sizes="44px" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden />
                )}
              </span>
              <span className="mt-3 min-w-0">
                <span className="flex items-center gap-1 text-sm font-black text-jd-text-primary">
                  {label}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-0.5 block text-xs leading-4 text-jd-text-muted">{sub}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
