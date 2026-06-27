import { Injectable } from '@nestjs/common';
import { DeliveryProviderType } from '@prisma/client';
import type { ILogisticsProvider } from '../../interfaces/logistics-provider.interface';
import { ProviderNotImplementedError } from '../../errors/logistics.errors';

/**
 * Own-fleet deliveries are dispatched via RiderAssignmentService, not this provider.
 * The registry exposes this type for health checks and future parity.
 */
@Injectable()
export class OwnFleetProvider implements ILogisticsProvider {
  readonly type = DeliveryProviderType.OWN_FLEET;

  private notViaApi(): never {
    throw new ProviderNotImplementedError(
      DeliveryProviderType.OWN_FLEET,
    );
  }

  createShipment() { return this.notViaApi(); }
  cancelShipment() { return this.notViaApi(); }
  trackShipment() { return this.notViaApi(); }
  estimatePrice() { return this.notViaApi(); }
  estimateETA() { return this.notViaApi(); }
  getProofOfDelivery() { return this.notViaApi(); }
  healthCheck() {
    return Promise.resolve({ healthy: true, message: 'Own fleet uses in-house rider assignment' });
  }
}
