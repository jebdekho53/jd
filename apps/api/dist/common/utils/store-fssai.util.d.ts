import type { PrismaService } from '../../database/prisma.service';
type FssaiPrisma = Pick<PrismaService, 'product' | 'storeVerificationDocument'>;
export declare function storeHasFssaiOnFile(prisma: FssaiPrisma, storeId: string): Promise<boolean>;
export {};
