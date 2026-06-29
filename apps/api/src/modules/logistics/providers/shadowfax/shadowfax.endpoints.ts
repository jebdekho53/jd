export type ShadowfaxApiMode = 'v3_marketplace' | 'v3_warehouse' | 'flash';

export type ShadowfaxEndpointSet = {
  createOrder: string;
  cancelOrder: (id: string) => string;
  trackOrder: (id: string) => string;
  serviceability: string;
  health: string;
};

export const SHADOWFAX_ENDPOINTS: Record<ShadowfaxApiMode, ShadowfaxEndpointSet> = {
  v3_marketplace: {
    createOrder: '/v3/clients/orders/',
    cancelOrder: (id) => `/v3/clients/orders/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/v3/clients/orders/${encodeURIComponent(id)}/track/`,
    serviceability: '/v3/clients/serviceability/',
    health: '/v3/clients/health/',
  },
  v3_warehouse: {
    createOrder: '/v3/clients/shipments/',
    cancelOrder: (id) => `/v3/clients/shipments/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/v3/clients/shipments/${encodeURIComponent(id)}/track/`,
    serviceability: '/v3/clients/serviceability/',
    health: '/v3/clients/health/',
  },
  flash: {
    createOrder: '/order/create/',
    cancelOrder: () => '/order/cancel/',
    trackOrder: (id) => `/order/track/${encodeURIComponent(id)}/`,
    serviceability: '/order/serviceability/',
    health: '/order/serviceability/',
  },
};

export function shadowfaxEndpointsForMode(mode: ShadowfaxApiMode): ShadowfaxEndpointSet {
  return SHADOWFAX_ENDPOINTS[mode];
}
