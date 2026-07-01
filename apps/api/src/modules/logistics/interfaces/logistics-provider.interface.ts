import { DeliveryProviderType, ShipmentProviderStatus } from '@prisma/client';

export interface ShipmentAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  awbNumber?: string;
  pickup: ShipmentAddress;
  dropoff: ShipmentAddress;
  codAmount?: number;
  weightGrams?: number;
  notes?: string;
}

export interface ShipmentResult {
  externalShipmentId: string;
  trackingNumber: string;
  estimatedEtaMins?: number;
  estimatedArrivalAt?: Date;
  deliveryCost?: number;
  providerStatus: string;
  normalizedStatus: ShipmentProviderStatus;
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
  labelUrl?: string;
  rawResponse?: Record<string, unknown>;
}

export interface TrackShipmentResult {
  externalShipmentId: string;
  trackingNumber: string;
  providerStatus: string;
  normalizedStatus: ShipmentProviderStatus;
  estimatedEtaMins?: number;
  estimatedArrivalAt?: Date;
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
  lat?: number;
  lng?: number;
  timeline?: Array<{
    status: ShipmentProviderStatus;
    description?: string;
    occurredAt: Date;
  }>;
  rawResponse?: Record<string, unknown>;
}

export interface PriceEstimateInput {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  weightGrams?: number;
}

export interface PriceEstimateResult {
  amount: number;
  currency: string;
  estimatedEtaMins?: number;
}

export interface ProofOfDeliveryResult {
  podUrl?: string;
  deliveredAt?: Date;
  signatureUrl?: string;
}

export interface ProviderHealthResult {
  healthy: boolean;
  latencyMs?: number;
  message?: string;
}

/** Logistics partner contract — orders never call provider APIs directly. */
export interface ILogisticsProvider {
  readonly type: DeliveryProviderType;

  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  cancelShipment(externalShipmentId: string, reason?: string): Promise<void>;
  trackShipment(externalShipmentId: string): Promise<TrackShipmentResult>;
  estimatePrice(input: PriceEstimateInput): Promise<PriceEstimateResult>;
  estimateETA(input: PriceEstimateInput): Promise<{ estimatedMins: number }>;
  assignDelivery?(input: CreateShipmentInput): Promise<ShipmentResult>;
  getProofOfDelivery(externalShipmentId: string): Promise<ProofOfDeliveryResult>;
  downloadLabel?(externalShipmentId: string): Promise<{ labelUrl: string }>;
  healthCheck(): Promise<ProviderHealthResult>;
}
