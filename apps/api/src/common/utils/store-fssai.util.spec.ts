import { StoreDocumentType } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { storeHasFssaiOnFile } from './store-fssai.util';

const mockPrisma = {
  product: { findFirst: jest.fn() },
  storeVerificationDocument: { findFirst: jest.fn() },
} as unknown as Pick<PrismaService, 'product' | 'storeVerificationDocument'>;

describe('storeHasFssaiOnFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.product.findFirst = jest.fn().mockResolvedValue(null);
    mockPrisma.storeVerificationDocument.findFirst = jest.fn().mockResolvedValue(null);
  });

  it('returns true when a product has fssaiLicense', async () => {
    mockPrisma.product.findFirst = jest.fn().mockResolvedValue({ fssaiLicense: '12345678901234' });

    await expect(storeHasFssaiOnFile(mockPrisma, 'store-1')).resolves.toBe(true);
    expect(mockPrisma.storeVerificationDocument.findFirst).not.toHaveBeenCalled();
  });

  it('returns true when store uploaded FSSAI certificate during onboarding', async () => {
    mockPrisma.storeVerificationDocument.findFirst = jest
      .fn()
      .mockResolvedValue({ id: 'doc-1' });

    await expect(storeHasFssaiOnFile(mockPrisma, 'store-1')).resolves.toBe(true);
    expect(mockPrisma.storeVerificationDocument.findFirst).toHaveBeenCalledWith({
      where: { storeId: 'store-1', documentType: StoreDocumentType.FSSAI_LICENSE },
      select: { id: true },
    });
  });

  it('returns false when neither product license nor certificate exists', async () => {
    await expect(storeHasFssaiOnFile(mockPrisma, 'store-1')).resolves.toBe(false);
  });
});
