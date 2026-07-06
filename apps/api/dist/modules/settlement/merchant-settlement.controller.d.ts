import { RequestUser } from '../../common/types';
import { SettlementService } from './settlement.service';
import { CreatePayoutRequestDto, ListSettlementsQueryDto } from './dto/settlement.dto';
export declare class MerchantSettlementController {
    private readonly settlement;
    constructor(settlement: SettlementService);
    getEarnings(user: RequestUser): Promise<{
        success: boolean;
        data: {
            wallet: {
                availableBalance: number;
                pendingBalance: number;
                totalEarned: number;
                totalPaidOut: number;
            };
            commissionBreakdown: {
                totalGross: number;
                totalCommission: number;
                totalNet: number;
            };
            recentOrdersRevenue: any;
            settlementHistory: any;
            openPayoutRequest: {
                id: any;
                amount: number;
                status: any;
                requestedAt: any;
            } | null;
        };
    }>;
    listSettlements(user: RequestUser, query: ListSettlementsQueryDto): Promise<{
        success: boolean;
        data: {
            settlements: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
    createPayout(user: RequestUser, dto: CreatePayoutRequestDto): Promise<{
        success: boolean;
        data: {
            id: any;
            amount: number;
            status: any;
            requestedAt: any;
        };
    }>;
    listPayouts(user: RequestUser, query: ListSettlementsQueryDto): Promise<{
        success: boolean;
        data: {
            payouts: any;
            meta: {
                page: number;
                limit: number;
                total: any;
                totalPages: number;
            };
        };
    }>;
}
