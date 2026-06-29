import { StoreDocumentType } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';

type FssaiPrisma = Pick<PrismaService, 'product' | 'storeVerificationDocument'>;

/** True when the store has an FSSAI license number on a product or an uploaded FSSAI certificate. */
export async function storeHasFssaiOnFile(
  prisma: FssaiPrisma,
  storeId: string,
): Promise<boolean> {
  const product = await prisma.product.findFirst({
    where: {
      storeId,
      deletedAt: null,
      fssaiLicense: { not: null },
      NOT: { fssaiLicense: '' },
    },
    orderBy: { updatedAt: 'desc' },
    select: { fssaiLicense: true },
  });
  if (product?.fssaiLicense?.trim()) return true;

  const doc = await prisma.storeVerificationDocument.findFirst({
    where: { storeId, documentType: StoreDocumentType.FSSAI_LICENSE },
    select: { id: true },
  });
  return Boolean(doc);
}
