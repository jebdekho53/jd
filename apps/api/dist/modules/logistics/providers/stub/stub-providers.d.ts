import type { ILogisticsProvider } from '../../interfaces/logistics-provider.interface';
export declare class PorterProvider implements ILogisticsProvider {
    readonly type: any;
    private notReady;
    createShipment(): never;
    cancelShipment(): never;
    trackShipment(): never;
    estimatePrice(): never;
    estimateETA(): never;
    getProofOfDelivery(): never;
    healthCheck(): never;
}
export declare class DelhiveryProvider implements ILogisticsProvider {
    readonly type: any;
    private notReady;
    createShipment(): never;
    cancelShipment(): never;
    trackShipment(): never;
    estimatePrice(): never;
    estimateETA(): never;
    getProofOfDelivery(): never;
    healthCheck(): never;
}
export declare class BorzoProvider implements ILogisticsProvider {
    readonly type: any;
    private notReady;
    createShipment(): never;
    cancelShipment(): never;
    trackShipment(): never;
    estimatePrice(): never;
    estimateETA(): never;
    getProofOfDelivery(): never;
    healthCheck(): never;
}
