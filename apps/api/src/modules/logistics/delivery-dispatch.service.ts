import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { useOwnFleetDispatch } from './utils/logistics-config.util';

@Injectable()
export class DeliveryDispatchService {
  private readonly logger = new Logger(DeliveryDispatchService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly riderAssignment: RiderAssignmentService,
    private readonly orchestrator: DeliveryOrchestratorService,
  ) {}

  /**
   * Called when merchant marks order READY_FOR_PICKUP.
   * Routes to own-fleet rider assignment or third-party logistics orchestrator.
   */
  async dispatchAfterReadyForPickup(orderId: string): Promise<{
    mode: 'own_fleet' | 'provider';
    deliveryId?: string;
    riderProfileId?: string;
    shipmentId?: string;
    trackingNumber?: string;
    estimatedEtaMins?: number | null;
  } | null> {
    if (useOwnFleetDispatch(this.config)) {
      const result = await this.riderAssignment.autoAssign(orderId);
      if (!result) return null;
      return {
        mode: 'own_fleet',
        deliveryId: result.deliveryId,
        riderProfileId: result.riderProfileId,
      };
    }

    try {
      const result = await this.orchestrator.dispatchShipment(orderId);
      return {
        mode: 'provider',
        deliveryId: result.deliveryId,
        shipmentId: result.shipmentId,
        trackingNumber: result.trackingNumber,
        estimatedEtaMins: result.estimatedEtaMins,
      };
    } catch (err) {
      this.logger.error({ orderId, err }, 'Provider dispatch failed — order stays READY_FOR_PICKUP');
      return null;
    }
  }
}
