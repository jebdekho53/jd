import { Injectable } from '@nestjs/common';
import { DeliveryProviderType } from '@prisma/client';
import type { ILogisticsProvider } from '../../interfaces/logistics-provider.interface';
import { ProviderNotImplementedError } from '../../errors/logistics.errors';

/** Placeholder for future Porter integration — registered when ENABLE_PORTER=true. */
@Injectable()
export class PorterProvider implements ILogisticsProvider {
  readonly type = DeliveryProviderType.PORTER;

  private notReady(): never {
    throw new ProviderNotImplementedError(DeliveryProviderType.PORTER);
  }

  createShipment() { return this.notReady(); }
  cancelShipment() { return this.notReady(); }
  trackShipment() { return this.notReady(); }
  estimatePrice() { return this.notReady(); }
  estimateETA() { return this.notReady(); }
  getProofOfDelivery() { return this.notReady(); }
  healthCheck() { return this.notReady(); }
}

@Injectable()
export class DelhiveryProvider implements ILogisticsProvider {
  readonly type = DeliveryProviderType.DELHIVERY;
  private notReady(): never {
    throw new ProviderNotImplementedError(DeliveryProviderType.DELHIVERY);
  }
  createShipment() { return this.notReady(); }
  cancelShipment() { return this.notReady(); }
  trackShipment() { return this.notReady(); }
  estimatePrice() { return this.notReady(); }
  estimateETA() { return this.notReady(); }
  getProofOfDelivery() { return this.notReady(); }
  healthCheck() { return this.notReady(); }
}
