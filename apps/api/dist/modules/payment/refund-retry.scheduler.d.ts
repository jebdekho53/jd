import { DistributedLockService } from '../../redis/distributed-lock.service';
import { OrderRefundService } from './order-refund.service';
export declare class RefundRetryScheduler {
    private readonly refunds;
    private readonly lock;
    private readonly logger;
    constructor(refunds: OrderRefundService, lock: DistributedLockService);
    retryFailedRefunds(): Promise<void>;
}
