import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributedLockService } from '../../redis/distributed-lock.service';
import { SettlementService } from './settlement.service';

@Injectable()
export class SettlementAutomationService {
  private readonly logger = new Logger(SettlementAutomationService.name);

  constructor(
    private readonly settlement: SettlementService,
    private readonly lock: DistributedLockService,
  ) {}

  /** Move PENDING ledger entries past eligibleAt → SETTLED (pending → available). */
  @Cron(CronExpression.EVERY_HOUR)
  async settleEligibleLedgers(): Promise<void> {
    await this.lock.runExclusive('cron:settlement-eligible', 3000, async () => {
      const count = await this.settlement.processEligibleSettlements();
      if (count > 0) {
        this.logger.log(`Settled ${count} eligible ledger entries`);
      }
    });
  }
}
