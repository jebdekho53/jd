import type { OrderClaimStatus, OrderClaimType, ReturnClaimReason } from '@prisma/client';
export declare class ClaimItemDto {
    orderItemId: string;
    quantity: number;
}
export declare class ClaimEvidenceDto {
    kind: 'PHOTO' | 'VIDEO';
    url: string;
}
export declare class CreateOrderClaimDto {
    claimType: OrderClaimType;
    reason: ReturnClaimReason;
    reasonNote?: string;
    items: ClaimItemDto[];
    evidence?: ClaimEvidenceDto[];
    idempotencyKey?: string;
}
export declare class ListMerchantClaimsDto {
    status?: OrderClaimStatus;
    claimType?: OrderClaimType;
    storeId?: string;
    page?: number;
    limit?: number;
}
export declare class PatchMerchantClaimDto {
    action: 'APPROVE' | 'REJECT' | 'REQUEST_EVIDENCE' | 'APPROVE_REPLACEMENT' | 'APPROVE_REFUND' | 'ISSUE_REPLACEMENT';
    note?: string;
    approvedAmount?: number;
    returnPickupEnabled?: boolean;
}
export declare class PatchAdminClaimDto extends PatchMerchantClaimDto {
    adminAction?: 'FORCE_REFUND' | 'SUSPEND_MERCHANT';
}
