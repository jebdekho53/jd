import type { ILogisticsProvider } from '../../interfaces/logistics-provider.interface';
export declare class OwnFleetProvider implements ILogisticsProvider {
    readonly type: "OWN_FLEET";
    private notViaApi;
    createShipment(): never;
    cancelShipment(): never;
    trackShipment(): never;
    estimatePrice(): never;
    estimateETA(): never;
    getProofOfDelivery(): never;
    healthCheck(): Promise<{
        healthy: boolean;
        message: string;
    }>;
}
