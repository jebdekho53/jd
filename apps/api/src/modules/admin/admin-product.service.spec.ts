import { NotFoundException } from '@nestjs/common';
import { AdminProductService } from './admin-product.service';

const mockPrisma = {
  product: { findFirst: jest.fn() },
  storePromotion: { findMany: jest.fn().mockResolvedValue([]) },
  coupon: { findMany: jest.fn().mockResolvedValue([]) },
  offer: { findMany: jest.fn().mockResolvedValue([]) },
  productReview: { aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4 }, _count: { id: 1 } }) },
};

describe('AdminProductService', () => {
  let service: AdminProductService;

  beforeEach(() => {
    service = new AdminProductService(mockPrisma as never);
    jest.clearAllMocks();
    mockPrisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      name: 'Milk',
      slug: 'milk',
      brand: 'Amul',
      isActive: true,
      deletedAt: null,
      ingredients: null,
      shelfLife: '2 days',
      countryOfOrigin: 'India',
      manufacturerName: null,
      manufacturerAddress: null,
      fssaiLicense: '123',
      storageInstructions: null,
      disclaimer: null,
      taxInclusive: false,
      hsnCodeId: 'hsn1',
      gstSlab: 'FIVE',
      taxCategory: 'GOODS',
      storeId: 's1',
      category: { id: 'c1', name: 'Dairy', slug: 'dairy' },
      hsnCodeRef: { id: 'hsn1', code: '0401', description: 'Milk', defaultGstSlab: 'FIVE' },
      store: {
        id: 's1',
        name: 'Store',
        slug: 'store',
        status: 'APPROVED',
        isActive: true,
        pincode: '110001',
        merchantProfile: {
          id: 'm1',
          businessName: 'Biz',
          user: { id: 'u1', email: 'a@b.com', phone: '999' },
        },
      },
      variants: [
        {
          id: 'v1',
          sku: 'SKU1',
          name: 'Default',
          price: 49,
          inventory: { availableQty: 5, reservedQty: 0, status: 'IN_STOCK' },
        },
      ],
      productReviews: [],
    });
  });

  it('returns product audit payload', async () => {
    const data = await service.getProductAudit('p1');
    expect(data.name).toBe('Milk');
    expect(data.tax.hsnCode).toBe('0401');
    expect(data.pdpPreviewUrl).toContain('/products/p1');
    expect(data.visibility.buyerVisible).toBe(true);
  });

  it('throws when product missing', async () => {
    mockPrisma.product.findFirst.mockResolvedValueOnce(null);
    await expect(service.getProductAudit('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
