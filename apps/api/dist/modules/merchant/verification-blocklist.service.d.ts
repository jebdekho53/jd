import { PrismaService } from '../../database/prisma.service';
export type BlocklistCheckInput = {
    phone?: string | null;
    email?: string | null;
    gstNumber?: string | null;
    panNumber?: string | null;
};
export declare class VerificationBlocklistService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    normalizePhone(phone: string): string;
    normalizeEmail(email: string): string;
    normalizeGst(gst: string): string;
    normalizePan(pan: string): string;
    private buildEntries;
    assertMerchantProfileNotBlacklisted(merchantProfileId: string): Promise<void>;
    assertUserNotBlacklisted(userId: string): Promise<void>;
    assertNotBlocked(input: BlocklistCheckInput): Promise<void>;
    blockMerchantIdentifiers(input: BlocklistCheckInput, reason: string, blockedBy: string, storeId?: string): Promise<void>;
    removeMerchantIdentifiers(input: BlocklistCheckInput): Promise<void>;
}
