import { Test, TestingModule } from '@nestjs/testing';
import { ProductDuplicateService } from './product-duplicate.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  product: { findMany: jest.fn() },
};

describe('ProductDuplicateService', () => {
  let service: ProductDuplicateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductDuplicateService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ProductDuplicateService);
    jest.clearAllMocks();
  });

  it('detects duplicate SKU', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'p-1', name: 'Milk', brand: 'Amul', unit: 'litre', sku: 'SKU-1' },
    ]);
    const index = await service.loadStoreProductIndex('s-1');
    const dup = service.checkDuplicate(index, { sku: 'SKU-1', name: 'Other', unit: 'piece' });
    expect(dup?.type).toBe('sku');
    expect(dup?.existingProductId).toBe('p-1');
  });

  it('detects duplicate name+brand+unit', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'p-2', name: 'Atta', brand: 'Aashirvaad', unit: 'kg', sku: null },
    ]);
    const index = await service.loadStoreProductIndex('s-1');
    const dup = service.checkDuplicate(index, {
      name: 'Atta',
      brand: 'Aashirvaad',
      unit: 'kg',
    });
    expect(dup?.type).toBe('identity');
  });
});
