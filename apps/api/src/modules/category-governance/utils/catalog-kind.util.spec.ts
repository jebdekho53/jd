import { CategoryCatalogKind, VerticalBusinessType } from '@prisma/client';
import { catalogKindForStoreBusinessTypes } from './catalog-kind.util';

describe('catalog-kind.util', () => {
  it('returns MENU for food-only business types', () => {
    expect(catalogKindForStoreBusinessTypes([VerticalBusinessType.RESTAURANT])).toBe(
      CategoryCatalogKind.MENU,
    );
    expect(
      catalogKindForStoreBusinessTypes([VerticalBusinessType.CLOUD_KITCHEN, VerticalBusinessType.CAFE]),
    ).toBe(CategoryCatalogKind.MENU);
  });

  it('returns PRODUCT for grocery and retail business types', () => {
    expect(catalogKindForStoreBusinessTypes([VerticalBusinessType.GROCERY])).toBe(
      CategoryCatalogKind.PRODUCT,
    );
    expect(catalogKindForStoreBusinessTypes([VerticalBusinessType.ELECTRONICS])).toBe(
      CategoryCatalogKind.PRODUCT,
    );
  });

  it('defaults to PRODUCT for mixed vertical stores', () => {
    expect(
      catalogKindForStoreBusinessTypes([
        VerticalBusinessType.RESTAURANT,
        VerticalBusinessType.GROCERY,
      ]),
    ).toBe(CategoryCatalogKind.PRODUCT);
  });
});
