import type { CreateShipmentInput, ILogisticsProvider, PriceEstimateInput, PriceEstimateResult, ProofOfDeliveryResult, ProviderHealthResult, ShipmentResult, TrackShipmentResult } from '../../interfaces/logistics-provider.interface';
import { ShadowfaxClient } from './shadowfax.client';
export declare class ShadowfaxProvider implements ILogisticsProvider {
    private readonly client;
    readonly type: "SHADOWFAX";
    constructor(client: ShadowfaxClient);
    createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
    cancelShipment(externalShipmentId: string, reason?: string): Promise<void>;
    trackShipment(externalShipmentId: string): Promise<TrackShipmentResult>;
    estimatePrice(input: PriceEstimateInput): Promise<PriceEstimateResult>;
    estimateETA(input: PriceEstimateInput): Promise<{
        estimatedMins: number;
    }>;
    getProofOfDelivery(externalShipmentId: string): Promise<ProofOfDeliveryResult>;
    downloadLabel(externalShipmentId: string): Promise<{
        labelUrl: string;
    }>;
    healthCheck(): Promise<ProviderHealthResult>;
    private toAddress;
}
