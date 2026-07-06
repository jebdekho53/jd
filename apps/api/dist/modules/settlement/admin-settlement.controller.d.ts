import { RequestUser } from '../../common/types';
import { SettlementService } from './settlement.service';
import { ListSettlementsQueryDto, RejectPayoutRequestDto } from './dto/settlement.dto';
export declare class AdminSettlementController {
    private readonly settlement;
    constructor(settlement: SettlementService);
    getOverview(): Promise<{
        success: boolean;
        data: {
            summary: {
                pendingPayouts: any;
                completedPayouts: any;
                totalMerchantLiability: number;
                availableLiability: number;
                pendingLiability: number;
                totalSettledToday: number;
                settlementsSettledToday: any;
            };
            merchantWallets: any;
            settlementLedger: any;
        };
    }>;
    listPayoutRequests(query: ListSettlementsQueryDto): Promise<{
        success: boolean;
        data: {
            payoutRequests: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    approve(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            status: any;
        };
    }>;
    reject(user: RequestUser, id: string, dto: RejectPayoutRequestDto): Promise<{
        success: boolean;
        data: {
            id: any;
            status: any;
        };
    }>;
    process(user: RequestUser, id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            status: any;
            referenceId: any;
            transactionId: any;
        };
    }>;
}
