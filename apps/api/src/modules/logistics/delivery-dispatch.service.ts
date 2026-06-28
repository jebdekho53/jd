import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiderAssignmentService } from '../rider-assignment/rider-assignment.service';
import { DeliveryOrchestratorService } from './delivery-orchestrator.service';
import { useOwnFleetDispatch } from './utils/logistics-config.util';

export type DispatchResult = {
  mode: 'own_fleet' | 'provider';
  deliveryId?: string;
  riderProfileId?: string;
  shipmentId?: string;
  trackingNumber?: string;
  estimatedEtaMins?: number | null;
} | null;

@Injectable()
export class DeliveryDispatchService {
  private readonly logger = new Logger(DeliveryDispatchService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly riderAssignment: RiderAssignmentService,
    private readonly orchestrator: DeliveryOrchestratorService,
  ) {}

  /**
   * Called as soon as payment is confirmed (COD checkout or online payment success).
   * Sends a rider/shipment request to Shadowfax or the configured logistics provider.
   */
  async dispatchAfterOrderPlaced(orderId: string): Promise<DispatchResult> {
    if (useOwnFleetDispatch(this.config)) {
      // Own-fleet riders are assigned when the merchant marks READY_FOR_PICKUP.
      return null;
    }

    return this.dispatchViaProvider(orderId, 'order placed');
  }

  /**
   * Called when merchant marks order READY_FOR_PICKUP.
   * Routes to own-fleet rider assignment or third-party logistics orchestrator.
   */
  async dispatchAfterReadyForPickup(orderId: string): Promise<DispatchResult> {
    if (useOwnFleetDispatch(this.config)) {
      const result = await this.riderAssignment.autoAssign(orderId);
      if (!result) return null;
      return {
        mode: 'own_fleet',
        deliveryId: result.deliveryId,
        riderProfileId: result.riderProfileId,
      };
    }

    return this.dispatchViaProvider(orderId, 'ready for pickup');
  }

  private async dispatchViaProvider(orderId: string, trigger: string): Promise<DispatchResult> {
    try {
      const result = await this.orchestrator.dispatchShipment(orderId);
      this.logger.log(
        {
          orderId,
          trigger,
          deliveryId: result.deliveryId,
          shipmentId: result.shipmentId,
          trackingNumber: result.trackingNumber,
        },
        'Provider shipment dispatched',
      );
      return {
        mode: 'provider',
        deliveryId: result.deliveryId,
        shipmentId: result.shipmentId,
        trackingNumber: result.trackingNumber,
        estimatedEtaMins: result.estimatedEtaMins,
      };
    } catch (err) {
      this.logger.error({ orderId, trigger, err }, 'Provider dispatch failed');
      return null;
    }
  }
}
