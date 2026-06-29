import { PrismaService } from '../../database/prisma.service';
import { FinanceAlertService } from '../finance/finance-alert.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';
export declare class FraudEngineService {
    private readonly prisma;
    private readonly alerts;
    private readonly lock;
    private readonly logger;
    constructor(prisma: PrismaService, alerts: FinanceAlertService, lock: DistributedLockService);
    runHourlyScan(): Promise<void>;
    private scanRefundAbuse;
    private scanCancellationAbuse;
    private scanCodFailures;
    private scanCouponFarming;
    private scanReferralAbuse;
    private scanWalletAbuse;
    private scanAiBillingAbuse;
}
