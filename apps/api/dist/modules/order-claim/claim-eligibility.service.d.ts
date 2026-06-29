import { ClaimActorType, OrderClaimStatus, OrderClaimType, Prisma, ReturnClaimReason } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { buildReturnPolicySummary, ProductPolicyInput } from '../../common/utils/product-return-policy.util';
export interface OrderClaimEligibility {
    orderId: string;
    deliveredAt: Date | null;
    actions: {
        return: boolean;
        refund: boolean;
        replacement: boolean;
    };
    items: Array<{
        orderItemId: string;
        productId: string;
        productName: string;
        maxQuantity: number;
        policy: ReturnType<typeof buildReturnPolicySummary>;
        claimTypes: OrderClaimType[];
        reasons: ReturnClaimReason[];
    }>;
}
export declare class ClaimEligibilityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveClaimedQuantities(orderItemIds: string[]): Promise<Map<string, number>>;
    productToPolicy(product: {
        isReturnable: boolean;
        isRefundable: boolean;
        isReplaceable: boolean;
        returnWindowHours: number | null;
        approvalMode: ProductPolicyInput['approvalMode'];
        proofRequired: ProductPolicyInput['proofRequired'];
        autoApproveBelowAmount: Prisma.Decimal | null;
        returnReasons: ReturnClaimReason[];
        restockingFee: Prisma.Decimal;
        refundMethod: ProductPolicyInput['refundMethod'];
        returnPolicyText: string | null;
        replacementPolicyText: string | null;
        preparedFoodPolicy: ProductPolicyInput['preparedFoodPolicy'];
        allowCustomerChangedMind: boolean;
    }): ProductPolicyInput;
    getOrderEligibility(orderId: string, buyerUserId: string): Promise<OrderClaimEligibility>;
    validateEvidence(policy: ProductPolicyInput, evidence: Array<{
        kind: string;
    }>): string | null;
    appendHistory(tx: Prisma.TransactionClient, claimId: string, status: OrderClaimStatus, actorType: ClaimActorType, actorId: string | null, note?: string, metadata?: Record<string, unknown>): Promise<void>;
}
