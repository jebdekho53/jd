import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProductCsvService } from './product-csv.service';
import { PrismaService } from '../../database/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductDuplicateService } from './product-duplicate.service';

const mockPrisma = {
  store: { findFirst: jest.fn() },
  hSNCode: { findFirst: jest.fn() },
  product: { findMany: jest.fn().mockResolvedValue([]) },
};
const mockMerchant = { requireMerchantProfile: jest.fn() };
const mockCategory = { listCategories: jest.fn() };
const mockProduct = { createProduct: jest.fn(), updateStatus: jest.fn() };

describe('ProductCsvService', () => {
  let service: ProductCsvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCsvService,
        ProductDuplicateService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MerchantService, useValue: mockMerchant },
        { provide: CategoryService, useValue: mockCategory },
        { provide: ProductService, useValue: mockProduct },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'PRODUCT_CSV_PLACEHOLDER_IMAGE_URL'
                ? 'https://cdn.example.com/placeholder.png'
                : undefined,
            ),
          },
        },
      ],
    }).compile();
    service = module.get(ProductCsvService);
    jest.clearAllMocks();
    mockMerchant.requireMerchantProfile.mockResolvedValue({ id: 'mp-1' });
    mockPrisma.store.findFirst.mockResolvedValue({ id: 's-1' });
    mockCategory.listCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Dairy', children: [{ id: 'sub-1', name: 'Milk' }] },
    ]);
    mockPrisma.product.findMany.mockResolvedValue([]);
    mockPrisma.hSNCode.findFirst.mockResolvedValue({ id: 'hsn-0401', code: '0401' });
  });

  it('uses imageUrl from CSV when valid', async () => {
    const header =
      'name,brand,category,subcategory,sku,unit,mrp,sellingPrice,stock,description,tags,hsnCode,gstSlab,fssaiLicense,ingredients,shelfLife,countryOfOrigin,manufacturerName,storageInstructions,imageUrl,isActive';
    const row = [
      'Img Product', 'Brand', 'Dairy', 'Milk', 'SKU-IMG', 'piece', '59', '49', '10',
      '', '', '0401', 'FIVE', '', '', '', '', '', '', 'https://cdn.example.com/p.jpg', 'true',
    ].join(',');
    const csv = `${header}\n${row}`;

    const result = await service.validateCsv('u-1', 's-1', csv);
    const row0 = result.rows[0];
    expect(row0.valid).toBe(true);
    expect(row0.preview.resolvedImageUrl).toBe('https://cdn.example.com/p.jpg');
    expect(row0.warnings).toHaveLength(0);
  });

  it('falls back to placeholder when imageUrl missing', async () => {
    const header =
      'name,brand,category,subcategory,sku,unit,mrp,sellingPrice,stock,description,tags,hsnCode,gstSlab,fssaiLicense,ingredients,shelfLife,countryOfOrigin,manufacturerName,storageInstructions,imageUrl,isActive';
    const row = [
      'No Img', 'Brand', 'Dairy', 'Milk', 'SKU-NOIMG', 'piece', '59', '49', '10',
      '', '', '0401', 'FIVE', '', '', '', '', '', '', '', 'true',
    ].join(',');
    const csv = `${header}\n${row}`;

    const result = await service.validateCsv('u-1', 's-1', csv);
    expect(result.rows[0].valid).toBe(true);
    expect(result.rows[0].preview.resolvedImageUrl).toBe('https://cdn.example.com/placeholder.png');
    expect(result.rows[0].warnings.some((w) => w.includes('placeholder'))).toBe(true);
  });

  it('rejects invalid imageUrl', async () => {
    const header =
      'name,brand,category,subcategory,sku,unit,mrp,sellingPrice,stock,description,tags,hsnCode,gstSlab,fssaiLicense,ingredients,shelfLife,countryOfOrigin,manufacturerName,storageInstructions,imageUrl,isActive';
    const row = [
      'Bad Img', 'Brand', 'Dairy', 'Milk', 'SKU-BAD', 'piece', '59', '49', '10',
      '', '', '0401', 'FIVE', '', '', '', '', '', '', 'not-a-url', 'true',
    ].join(',');
    const csv = `${header}\n${row}`;

    const result = await service.validateCsv('u-1', 's-1', csv);
    expect(result.rows[0].valid).toBe(false);
    expect(result.rows[0].errors.some((e) => e.includes('imageUrl'))).toBe(true);
  });

  it('marks duplicate SKU rows invalid', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { id: 'p-existing', name: 'Existing', brand: 'B', unit: 'piece', sku: 'DUP-SKU' },
    ]);
    const header =
      'name,brand,category,subcategory,sku,unit,mrp,sellingPrice,stock,description,tags,hsnCode,gstSlab,fssaiLicense,ingredients,shelfLife,countryOfOrigin,manufacturerName,storageInstructions,imageUrl,isActive';
    const row = [
      'New Product', 'Brand', 'Dairy', 'Milk', 'DUP-SKU', 'piece', '59', '49', '10',
      '', '', '0401', 'FIVE', '', '', '', '', '', '', 'https://cdn.example.com/p.jpg', 'true',
    ].join(',');
    const csv = `${header}\n${row}`;

    const result = await service.validateCsv('u-1', 's-1', csv);
    expect(result.rows[0].valid).toBe(false);
    expect(result.rows[0].errors.some((e) => e.includes('Duplicate SKU'))).toBe(true);
  });

  it('marks rows without HSN invalid', async () => {
    const header =
      'name,brand,category,subcategory,sku,unit,mrp,sellingPrice,stock,description,tags,hsnCode,gstSlab,fssaiLicense,ingredients,shelfLife,countryOfOrigin,manufacturerName,storageInstructions,imageUrl,isActive';
    const row = [
      'Missing HSN', 'Brand', 'Dairy', 'Milk', 'SKU-NO-HSN', 'piece', '59', '49', '10',
      '', '', '', 'FIVE', '', '', '', '', '', '', 'https://cdn.example.com/p.jpg', 'true',
    ].join(',');
    const csv = `${header}\n${row}`;

    const result = await service.validateCsv('u-1', 's-1', csv);
    expect(result.rows[0].valid).toBe(false);
    expect(result.rows[0].errors).toContain('hsnCode is required');
  });
});
