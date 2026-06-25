import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RiderAssignmentService } from './rider-assignment.service';

@Injectable()
export class RiderAssignmentScheduler {
  private readonly logger = new Logger(RiderAssignmentScheduler.name);

  constructor(private readonly assignment: RiderAssignmentService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleOfferTimeouts() {
    try {
      await this.assignment.processPendingOffers();
    } catch (err) {
      this.logger.error('Offer timeout processing failed', err instanceof Error ? err.stack : String(err));
    }
  }
}
