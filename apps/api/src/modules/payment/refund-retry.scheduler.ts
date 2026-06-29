import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from '../../redis/distributed-lock.service';
import { OrderRefundService } from './order-refund.service';

@Injectable()
export class RefundRetryScheduler {
  private readonly logger = new Logger(RefundRetryScheduler.name);

  constructor(
    private readonly refunds: OrderRefundService,
    private readonly lock: DistributedLockService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedRefunds(): Promise<void> {
    await this.lock.runExclusive('cron:refund-retry', 240, async () => {
      const count = await this.refunds.retryFailedRefunds();
      if (count > 0) {
        this.logger.log(`Retried ${count} failed order refunds`);
      }
    });
  }
}
