import { RequestUser } from '../../common/types';
import { RiderPayoutService } from './rider-payout.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { CodSubmitDto } from './dto/finance.dto';
import { PrismaService } from '../../database/prisma.service';
export declare class RiderFinanceController {
    private readonly payouts;
    private readonly cod;
    private readonly prisma;
    constructor(payouts: RiderPayoutService, cod: CodReconciliationService, prisma: PrismaService);
    private riderProfileId;
    earnings(user: RequestUser): Promise<{
        success: boolean;
        data: {
            today: number;
            thisWeek: number;
            pendingPayout: number;
            totalPaid: number;
            recentDeliveries: any;
        };
    }>;
    submitCod(user: RequestUser, dto: CodSubmitDto): Promise<{
        success: boolean;
        data: {
            submitted: any;
            expected: number;
            deposited: number;
            mismatch: number;
        };
    }>;
}
