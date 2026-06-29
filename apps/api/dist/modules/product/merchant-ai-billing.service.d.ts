import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MerchantAiWalletService } from './merchant-ai-wallet.service';
export declare class MerchantAiBillingService {
    private readonly prisma;
    private readonly configService;
    private readonly wallet;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, wallet: MerchantAiWalletService);
    getPricePaise(): number;
    getMinRechargePaise(): number;
    buildCreateProductIdempotencyKey(merchantProfileId: string, storeId: string, analysisId: string): string;
    chargeForProductCreation(merchantProfileId: string, storeId: string, analysisId: string, userId: string, ipAddress?: string): Promise<{
        charged: boolean;
        amountPaise: number;
        transactionId: string;
    }>;
    refundOnProductCreationFailure(merchantProfileId: string, storeId: string, analysisId: string, reason: string, userId?: string, ipAddress?: string): Promise<void>;
    assertDailyAnalysisLimit(merchantProfileId: string): Promise<void>;
}
