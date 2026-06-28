import type { Product } from '@/types/product';

/** Mirrors API `product-compliance.util` — keep in sync. */

export interface CategoryRef {
  slug: string;
  name: string;
}

const HSN_CATEGORY_RE =
  /grocery|food|dairy|beverage|snack|packaged|fruit|vegetable|meat|fish|bakery|sweet/i;

const FSSAI_CATEGORY_RE =
  /grocery|dairy|beverage|snack|packaged|fruit|vegetable|meat|fish|bakery|sweet/i;

const FSSAI_EXCLUDE_RE =
  /supplement|nutrition|personal-care|electronics|beauty|mobile|appliance|stationery|fashion|pharmacy|pet/i;

function categoryText(category: CategoryRef): string {
  return `${category.slug} ${category.name}`;
}

export function isHsnRequiredCategory(category: CategoryRef): boolean {
  return HSN_CATEGORY_RE.test(categoryText(category));
}

export function isFssaiRequiredCategory(category: CategoryRef): boolean {
  const text = categoryText(category);
  if (FSSAI_EXCLUDE_RE.test(text)) return false;
  return FSSAI_CATEGORY_RE.test(text);
}

/** @deprecated use isHsnRequiredCategory */
export function isRegulatedProductCategory(slug: string, name: string): boolean {
  return isHsnRequiredCategory({ slug, name });
}

export function isBrokenProductImageUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return true;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    return u.protocol !== 'https:';
  } catch {
    return true;
  }
}

export type ProductVisibilityGap = 'image' | 'category' | 'hsn' | 'fssai';

export function resolveFormCategory(
  parentCategoryId: string,
  subCategoryId: string,
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    children?: Array<{ id: string; name: string; slug: string }>;
  }>,
): CategoryRef | null {
  if (subCategoryId) {
    for (const parent of categories) {
      const child = parent.children?.find((c) => c.id === subCategoryId);
      if (child) return { slug: child.slug, name: child.name };
    }
  }
  if (parentCategoryId) {
    const parent = categories.find((c) => c.id === parentCategoryId);
    if (parent) return { slug: parent.slug, name: parent.name };
  }
  return null;
}

export function requiresHsnForCategory(
  category: CategoryRef | null,
  taxCategory: string,
): boolean {
  if (!category) return false;
  if (taxCategory === 'EXEMPT' || taxCategory === 'NIL_RATED') return false;
  return isHsnRequiredCategory(category);
}

export function requiresFssaiForCategory(category: CategoryRef | null): boolean {
  if (!category) return false;
  return isFssaiRequiredCategory(category);
}

/** Reuse FSSAI already saved on another product in the same store. */
export function pickStoreFssaiLicense(products: Product[]): string | undefined {
  for (const p of products) {
    const license = p.fssaiLicense?.trim();
    if (license) return license;
  }
  return undefined;
}

export function getProductVisibilityGaps(
  product: Product,
  taxCategory: string = product.taxCategory ?? 'GOODS',
  storeFssaiLicense?: string | null,
): ProductVisibilityGap[] {
  const gaps: ProductVisibilityGap[] = [];
  if (isBrokenProductImageUrl(product.imageUrls[0])) gaps.push('image');
  if (!product.categoryId) gaps.push('category');

  const cat = product.category;
  if (cat && requiresHsnForCategory({ slug: cat.slug, name: cat.name }, taxCategory)) {
    if (!product.hsnCodeRef?.id && !product.hsnCodeId) gaps.push('hsn');
  }
  if (cat && requiresFssaiForCategory({ slug: cat.slug, name: cat.name })) {
    const onProduct = product.fssaiLicense?.trim();
    const inherited = storeFssaiLicense?.trim();
    if (!onProduct && !inherited) gaps.push('fssai');
  }
  return gaps;
}

export const VISIBILITY_GAP_LABELS: Record<ProductVisibilityGap, string> = {
  image: 'Product image',
  category: 'Category',
  hsn: 'HSN code',
  fssai: 'FSSAI license',
};
