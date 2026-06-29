import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FinanceCommissionService } from './finance-commission.service';
import { LedgerService } from './ledger.service';
export interface FreezeOrderInput {
    orderId: string;
    storeId: string;
    subtotal: number;
    discountAmount: number;
    offerSubsidy?: number;
    merchantContribution?: number;
    platformContribution?: number;
    deliveryFee: number;
    taxAmount?: number;
    paymentMethod: PaymentMethod;
}
export declare class OrderFinancialsService {
    private readonly prisma;
    private readonly commission;
    private readonly ledger;
    private readonly logger;
    constructor(prisma: PrismaService, commission: FinanceCommissionService, ledger: LedgerService);
    freezeOnOrderCreate(input: FreezeOrderInput): Promise<void>;
    recordOnlinePaymentConfirmed(orderId: string): Promise<void>;
    getOrderFinancials(orderId: string): Promise<{
        orderId: string;
        subtotal: number;
        discountAmount: number;
        offerSubsidy: number;
        merchantContribution: number;
        platformContribution: number;
        deliveryFee: number;
        taxAmount: number;
        commissionPercent: number;
        commissionAmount: number;
        netMerchantEarnings: number;
        netPlatformEarnings: number;
        riderPayoutAmount: number;
        frozenAt: string;
        storeSnapshot: Prisma.JsonValue;
    } | null>;
    getOrderFinancialsForMerchant(orderId: string, merchantUserId: string): Promise<{
        orderId: string;
        subtotal: number;
        discountAmount: number;
        offerSubsidy: number;
        merchantContribution: number;
        platformContribution: number;
        deliveryFee: number;
        taxAmount: number;
        commissionPercent: number;
        commissionAmount: number;
        netMerchantEarnings: number;
        netPlatformEarnings: number;
        riderPayoutAmount: number;
        frozenAt: string;
        storeSnapshot: Prisma.JsonValue;
    } | null>;
    private formatFinancials;
    private estimateRiderPayout;
}
