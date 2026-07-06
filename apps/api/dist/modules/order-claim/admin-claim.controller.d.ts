import { RequestUser } from '../../common/types/index';
import { OrderClaimService } from './order-claim.service';
import { ListMerchantClaimsDto, PatchAdminClaimDto } from './dto/order-claim.dto';
export declare class AdminClaimController {
    private readonly claims;
    constructor(claims: OrderClaimService);
    listClaims(dto: ListMerchantClaimsDto): Promise<{
        success: boolean;
        data: {
            items: any;
            pagination: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    patchClaim(user: RequestUser, claimId: string, dto: PatchAdminClaimDto): Promise<{
        success: boolean;
        data: {
            id: any;
            claimNumber: any;
            orderId: any;
            orderNumber: any;
            storeId: any;
            claimType: any;
            status: any;
            reason: any;
            reasonNote: any;
            requestedAmount: number;
            approvedAmount: number | null;
            restockingFee: number;
            merchantNote: any;
            adminNote: any;
            replacementOrderId: any;
            returnPickupEnabled: any;
            resolvedAt: any;
            createdAt: any;
            updatedAt: any;
            items: any;
            evidence: any;
            history: any;
            refund: any;
            replacement: any;
        };
    }>;
}
