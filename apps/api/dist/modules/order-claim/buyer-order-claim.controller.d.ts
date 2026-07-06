import { RequestUser } from '../../common/types/index';
import { OrderClaimService } from './order-claim.service';
import { CreateOrderClaimDto } from './dto/order-claim.dto';
export declare class BuyerOrderClaimController {
    private readonly claims;
    constructor(claims: OrderClaimService);
    getEligibility(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: import("./claim-eligibility.service").OrderClaimEligibility;
    }>;
    createClaim(user: RequestUser, orderId: string, dto: CreateOrderClaimDto): Promise<{
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
    listClaims(user: RequestUser, orderId: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
