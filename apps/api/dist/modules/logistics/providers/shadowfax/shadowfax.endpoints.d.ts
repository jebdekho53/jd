export type ShadowfaxApiMode = 'dale_staging' | 'dale_production' | 'legacy' | 'hl_staging' | 'v3_marketplace' | 'v3_warehouse' | 'flash';
export type ShadowfaxEndpointSet = {
    createOrder: string;
    cancelOrder: (id: string) => string;
    trackOrder: (id: string) => string;
    serviceability: string;
    health: string;
};
export declare const SHADOWFAX_ENDPOINTS: Record<ShadowfaxApiMode, ShadowfaxEndpointSet>;
export declare function shadowfaxEndpointsForMode(mode: ShadowfaxApiMode): ShadowfaxEndpointSet;
