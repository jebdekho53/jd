import { getProductVisibilityGaps } from '@/features/products/product-visibility.util';
import type { Product } from '@/types/product';

const baseProduct: Product = {
  id: 'p-1',
  name: 'Test Product',
  slug: 'test-product',
  description: null,
  brand: null,
  sku: null,
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Electronics', slug: 'electronics', parentId: null },
  imageUrls: ['https://api.jebdekho.com/uploads/product/test.jpg'],
  basePrice: 99,
  mrp: 120,
  unit: 'piece',
  weightGrams: null,
  isVeg: null,
  tags: [],
  isActive: true,
  sortOrder: 0,
  hsnCodeId: null,
  gstSlab: 'EIGHTEEN',
  taxCategory: 'GOODS',
  hsnCodeRef: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  variants: [],
};

describe('product visibility HSN gaps', () => {
  it('flags missing HSN for every product category', () => {
    expect(getProductVisibilityGaps(baseProduct)).toContain('hsn');
  });

  it('does not flag HSN when an HSN reference is present', () => {
    expect(
      getProductVisibilityGaps({
        ...baseProduct,
        hsnCodeId: 'hsn-8517',
        hsnCodeRef: {
          id: 'hsn-8517',
          code: '8517',
          description: 'Electronics',
          defaultGstSlab: 'EIGHTEEN',
        },
      }),
    ).not.toContain('hsn');
  });
});
