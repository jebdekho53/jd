import { DistributedLockService } from '../../redis/distributed-lock.service';
import { SettlementService } from './settlement.service';
export declare class SettlementAutomationService {
    private readonly settlement;
    private readonly lock;
    private readonly logger;
    constructor(settlement: SettlementService, lock: DistributedLockService);
    settleEligibleLedgers(): Promise<void>;
}
