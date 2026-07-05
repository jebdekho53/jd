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
import { resolveCategoryImage } from '@/lib/category-images';

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
  /** When true, show every category (categories index). Default caps at 11. */
  showAll?: boolean;
}

export function CategoryExplorer({ categories = [], className, showAll = false }: CategoryExplorerProps) {
  const flat = flattenCategories(categories);
  const display =
    flat.length > 0
      ? showAll ? flat : flat.slice(0, 11)
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
        const image = resolveCategoryImage(cat);
        return (
          <Link
            key={cat.id}
            href={href}
            role="listitem"
            className="group flex min-h-[118px] flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card p-2.5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-3"
          >
            <div className="relative flex aspect-square w-16 items-center justify-center overflow-hidden rounded-2xl bg-cream-3 text-primary transition group-hover:bg-primary/10 sm:w-[72px]">
              {image ? (
                <Image
                  src={image}
                  alt={cat.name}
                  fill
                  className="object-contain p-1.5"
                  sizes="72px"
                />
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
  const display =
    flat.length > 0
      ? flat
      : FALLBACK_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: null as string | null,
        }));

  return (
    <div
      className={cn('flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x', className)}
      role="list"
      aria-label="Categories"
    >
      {display.map((cat) => {
        const Icon = getIcon(cat.slug);
        const href = `/categories/${cat.slug}`;
        const image = resolveCategoryImage(cat);
        return (
          <Link
            key={cat.id}
            href={href}
            role="listitem"
            className="group flex w-[82px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl p-1 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="relative flex aspect-square w-16 items-center justify-center overflow-hidden rounded-2xl bg-card shadow-card transition group-hover:shadow-elevated">
              {image ? (
                <Image
                  src={image}
                  alt={cat.name}
                  fill
                  className="object-contain p-1.5"
                  sizes="64px"
                />
              ) : (
                <Icon className="h-6 w-6 text-primary" aria-hidden />
              )}
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
