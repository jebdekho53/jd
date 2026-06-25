import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettlementService } from './settlement.service';

@Injectable()
export class SettlementAutomationService {
  private readonly logger = new Logger(SettlementAutomationService.name);

  constructor(private readonly settlement: SettlementService) {}

  /** Move PENDING ledger entries past eligibleAt → SETTLED (pending → available). */
  @Cron(CronExpression.EVERY_HOUR)
  async settleEligibleLedgers(): Promise<void> {
    const count = await this.settlement.processEligibleSettlements();
    if (count > 0) {
      this.logger.log(`Settled ${count} eligible ledger entries`);
    }
  }
}
