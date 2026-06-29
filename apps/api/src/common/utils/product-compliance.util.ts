/** Category/subcategory text used for GST & FSSAI rules (effective = subcategory if set, else parent). */

export interface CategoryComplianceRef {
  slug: string;
  name: string;
}

const HSN_CATEGORY_RE =
  /grocery|food|dairy|beverage|snack|packaged|fruit|vegetable|meat|fish|bakery|sweet/i;

/** Edible / grocery catalogue — FSSAI applies here only. */
const FSSAI_CATEGORY_RE =
  /grocery|dairy|beverage|snack|packaged|fruit|vegetable|meat|fish|bakery|sweet/i;

/** Never ask FSSAI on these catalogue branches (parent or subcategory). */
const FSSAI_EXCLUDE_RE =
  /supplement|nutrition|personal-care|electronics|beauty|mobile|appliance|stationery|fashion|pharmacy|pet/i;

export function categoryComplianceText(category: CategoryComplianceRef): string {
  return `${category.slug} ${category.name}`;
}

export function isHsnRequiredCategory(category: CategoryComplianceRef): boolean {
  return HSN_CATEGORY_RE.test(categoryComplianceText(category));
}

export function isFssaiRequiredCategory(category: CategoryComplianceRef): boolean {
  const text = categoryComplianceText(category);
  if (FSSAI_EXCLUDE_RE.test(text)) return false;
  return FSSAI_CATEGORY_RE.test(text);
}

export function isTaxComplianceCategory(
  category: CategoryComplianceRef,
  taxCategory: string,
): boolean {
  if (taxCategory === 'EXEMPT' || taxCategory === 'NIL_RATED') return false;
  return isHsnRequiredCategory(category);
}

export function isPublicProductImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return false;
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface ProductBuyerComplianceInput {
  imageUrls: string[];
  categoryId: string | null;
  category?: CategoryComplianceRef | null;
  hsnCodeId?: string | null;
  fssaiLicense?: string | null;
  taxCategory?: string | null;
  storeFssaiLicense?: string | null;
}

/** True when the product should stay hidden from buyer catalogue (merchant "Needs update"). */
export function hasProductBuyerComplianceGaps(input: ProductBuyerComplianceInput): boolean {
  if (!isPublicProductImageUrl(input.imageUrls[0])) return true;
  if (!input.categoryId || !input.category) return true;

  const taxCategory = input.taxCategory ?? 'GOODS';
  if (
    isTaxComplianceCategory(input.category, taxCategory) &&
    !input.hsnCodeId
  ) {
    return true;
  }

  if (isFssaiRequiredCategory(input.category)) {
    const onProduct = input.fssaiLicense?.trim();
    const inherited = input.storeFssaiLicense?.trim();
    if (!onProduct && !inherited) return true;
  }

  return false;
}
