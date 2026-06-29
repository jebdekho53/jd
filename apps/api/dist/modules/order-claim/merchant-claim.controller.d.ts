import { RequestUser } from '../../common/types/index';
import { OrderClaimService } from './order-claim.service';
import { ListMerchantClaimsDto, PatchMerchantClaimDto } from './dto/order-claim.dto';
export declare class MerchantClaimController {
    private readonly claims;
    constructor(claims: OrderClaimService);
    listClaims(user: RequestUser, dto: ListMerchantClaimsDto): Promise<{
        success: boolean;
        data: {
            items: {
                id: string;
                claimNumber: string;
                orderId: string;
                orderNumber: string;
                storeId: string;
                claimType: import("@prisma/client").$Enums.OrderClaimType;
                status: import("@prisma/client").$Enums.OrderClaimStatus;
                reason: import("@prisma/client").$Enums.ReturnClaimReason;
                reasonNote: string | null;
                requestedAmount: number;
                approvedAmount: number | null;
                restockingFee: number;
                merchantNote: string | null;
                adminNote: string | null;
                replacementOrderId: string | null;
                returnPickupEnabled: boolean;
                resolvedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                items: {
                    id: string;
                    orderItemId: string;
                    productId: string;
                    productName: string;
                    quantityClaimed: number;
                    quantityApproved: number | null;
                    unitPrice: number;
                    refundAmount: number;
                }[];
                evidence: {
                    id: string;
                    createdAt: Date;
                    kind: string;
                    url: string;
                    claimId: string;
                }[];
                history: {
                    id: string;
                    status: import("@prisma/client").$Enums.OrderClaimStatus;
                    metadata: import("@prisma/client/runtime/library").JsonValue | null;
                    createdAt: Date;
                    actorId: string | null;
                    actorType: import("@prisma/client").$Enums.ClaimActorType;
                    note: string | null;
                    claimId: string;
                }[];
                refund: {
                    amount: number;
                    walletAmount: number;
                    razorpayAmount: number;
                    idempotencyKey: string;
                    id: string;
                    status: import("@prisma/client").$Enums.PaymentStatus;
                    processedAt: Date | null;
                    createdAt: Date;
                    claimId: string;
                    razorpayRefundId: string | null;
                    walletTxnId: string | null;
                } | null;
                replacement: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    claimId: string;
                    shipmentId: string | null;
                    replacementOrderId: string;
                    shippedAt: Date | null;
                } | null;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    analytics(user: RequestUser, storeId?: string): Promise<{
        success: boolean;
        data: {
            refundRatePct: number;
            replacementRatePct: number;
            totalClaims: number;
            refundCost: number;
            replacementCount: number;
            topReturnedProducts: {
                productId: string;
                productName: string;
                claimCount: number;
            }[];
            statusBreakdown: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.OrderClaimGroupByOutputType, ("status" | "claimType")[]> & {
                _count: number;
            })[];
        };
    }>;
    patchClaim(user: RequestUser, claimId: string, dto: PatchMerchantClaimDto): Promise<{
        success: boolean;
        data: {
            id: string;
            claimNumber: string;
            orderId: string;
            orderNumber: string;
            storeId: string;
            claimType: import("@prisma/client").$Enums.OrderClaimType;
            status: import("@prisma/client").$Enums.OrderClaimStatus;
            reason: import("@prisma/client").$Enums.ReturnClaimReason;
            reasonNote: string | null;
            requestedAmount: number;
            approvedAmount: number | null;
            restockingFee: number;
            merchantNote: string | null;
            adminNote: string | null;
            replacementOrderId: string | null;
            returnPickupEnabled: boolean;
            resolvedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            items: {
                id: string;
                orderItemId: string;
                productId: string;
                productName: string;
                quantityClaimed: number;
                quantityApproved: number | null;
                unitPrice: number;
                refundAmount: number;
            }[];
            evidence: {
                id: string;
                createdAt: Date;
                kind: string;
                url: string;
                claimId: string;
            }[];
            history: {
                id: string;
                status: import("@prisma/client").$Enums.OrderClaimStatus;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                actorId: string | null;
                actorType: import("@prisma/client").$Enums.ClaimActorType;
                note: string | null;
                claimId: string;
            }[];
            refund: {
                amount: number;
                walletAmount: number;
                razorpayAmount: number;
                idempotencyKey: string;
                id: string;
                status: import("@prisma/client").$Enums.PaymentStatus;
                processedAt: Date | null;
                createdAt: Date;
                claimId: string;
                razorpayRefundId: string | null;
                walletTxnId: string | null;
            } | null;
            replacement: {
                id: string;
                status: string;
                createdAt: Date;
                claimId: string;
                shipmentId: string | null;
                replacementOrderId: string;
                shippedAt: Date | null;
            } | null;
        };
    }>;
}
