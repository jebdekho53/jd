'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Apple,
  Baby,
  Coffee,
  Cookie,
  Droplets,
  Flame,
  Leaf,
  Milk,
  PawPrint,
  ShoppingBasket,
  Wheat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '@/types/buyer';

const FALLBACK_CATEGORIES = [
  { id: 'grocery', name: 'Grocery', slug: 'grocery', icon: ShoppingBasket },
  { id: 'fruits', name: 'Fruits', slug: 'fruits', icon: Apple },
  { id: 'vegetables', name: 'Vegetables', slug: 'vegetables', icon: Leaf },
  { id: 'dairy', name: 'Dairy', slug: 'dairy', icon: Milk },
  { id: 'bakery', name: 'Bakery', slug: 'bakery', icon: Wheat },
  { id: 'snacks', name: 'Snacks', slug: 'snacks', icon: Cookie },
  { id: 'beverages', name: 'Beverages', slug: 'beverages', icon: Coffee },
  { id: 'household', name: 'Household', slug: 'household', icon: Droplets },
  { id: 'personal', name: 'Personal Care', slug: 'personal-care', icon: Droplets },
  { id: 'baby', name: 'Baby Care', slug: 'baby-care', icon: Baby },
  { id: 'pet', name: 'Pet Care', slug: 'pet-care', icon: PawPrint },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  fruits: Leaf,
  vegetables: Leaf,
  dairy: Milk,
  beverages: Coffee,
  snacks: Cookie,
  bakery: Wheat,
  staples: ShoppingBasket,
  grocery: ShoppingBasket,
  frozen: Flame,
  organic: Apple,
  baby: Baby,
  pet: PawPrint,
};

function getIcon(slug: string) {
  const key = Object.keys(ICON_MAP).find((k) => slug.toLowerCase().includes(k));
  return key ? ICON_MAP[key] : ShoppingBasket;
}

interface CategoryExplorerProps {
  categories?: CategoryItem[];
  className?: string;
}

export function CategoryExplorer({ categories = [], className }: CategoryExplorerProps) {
  const flat = flattenCategories(categories);
  const display =
    flat.length > 0
      ? flat.slice(0, 11)
      : FALLBACK_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: null as string | null,
        }));

  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6',
        className,
      )}
      role="list"
      aria-label="Shop by category"
    >
      {display.map((cat) => {
        const Icon = getIcon(cat.slug);
        const href = `/categories/${cat.slug}`;
        return (
          <Link
            key={cat.id}
            href={href}
            role="listitem"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-transparent bg-card p-3 text-center shadow-card transition hover:border-primary/20 card-hover"
          >
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-cream-3 text-primary transition group-hover:bg-primary/10">
              {cat.imageUrl ? (
                <Image src={cat.imageUrl} alt="" fill className="object-cover" sizes="48px" />
              ) : (
                <Icon className="h-5 w-5" aria-hidden />
              )}
            </div>
            <span className="line-clamp-2 text-[11px] font-medium leading-tight text-jd-text-primary sm:text-xs">
              {cat.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Horizontal scroll variant for mobile category rail */
export function CategoryRail({ categories = [], className }: CategoryExplorerProps) {
  const flat = flattenCategories(categories).slice(0, 12);

  return (
    <div
      className={cn('flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x', className)}
      role="list"
      aria-label="Categories"
    >
      {(flat.length ? flat : FALLBACK_CATEGORIES).map((cat) => {
        const Icon = 'icon' in cat ? cat.icon : getIcon(cat.slug);
        const href = `/categories/${cat.slug}`;
        return (
          <Link
            key={cat.id}
            href={href}
            role="listitem"
            className="flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-card">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <span className="line-clamp-2 text-center text-[10px] font-medium text-jd-text-primary">
              {cat.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  for (const cat of categories) {
    result.push(cat);
    if (cat.children.length > 0) result.push(...flattenCategories(cat.children));
  }
  return result;
}
