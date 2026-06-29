import { CategoryCatalogKind, StoreBusinessTypeStatus, VerticalBusinessType } from '@prisma/client';
import { isFoodVertical } from '../../food/vertical.constants';

export function catalogKindForStoreBusinessTypes(
  businessTypes: VerticalBusinessType[],
): CategoryCatalogKind {
  const hasFood = businessTypes.some((t) => isFoodVertical(t));
  const hasProduct = businessTypes.some(
    (t) => !isFoodVertical(t) && t !== VerticalBusinessType.LOCAL_STORE,
  );
  if (hasFood && !hasProduct) return CategoryCatalogKind.MENU;
  if (hasProduct && !hasFood) return CategoryCatalogKind.PRODUCT;
  // Mixed or unknown — show product catalog by default (merchant can still request menu via explicit filter)
  return CategoryCatalogKind.PRODUCT;
}

export async function resolveStoreCatalogKind(
  prisma: {
    storeBusinessType: {
      findMany: (args: {
        where: { storeId: string; status?: StoreBusinessTypeStatus };
        select: { businessType: true };
      }) => Promise<Array<{ businessType: VerticalBusinessType }>>;
    };
  },
  storeId: string,
  explicit?: CategoryCatalogKind,
): Promise<CategoryCatalogKind> {
  if (explicit) return explicit;
  const rows = await prisma.storeBusinessType.findMany({
    where: { storeId, status: StoreBusinessTypeStatus.APPROVED },
    select: { businessType: true },
  });
  if (rows.length === 0) return CategoryCatalogKind.PRODUCT;
  return catalogKindForStoreBusinessTypes(rows.map((r) => r.businessType));
}
