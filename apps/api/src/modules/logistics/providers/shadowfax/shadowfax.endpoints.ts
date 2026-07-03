export type ShadowfaxApiMode = 'dale_staging' | 'dale_production' | 'legacy' | 'hl_staging' | 'v3_marketplace' | 'v3_warehouse' | 'flash';

export type ShadowfaxEndpointSet = {
  createOrder: string;
  cancelOrder: (id: string) => string;
  trackOrder: (id: string) => string;
  serviceability: string;
  health: string;
};

export const SHADOWFAX_ENDPOINTS: Record<ShadowfaxApiMode, ShadowfaxEndpointSet> = {
  dale_staging: {
    // Dale (dale.staging/dale.shadowfax.in) serves the V3 clients/orders API under
    // the /api base. Verified against dale.staging: POST /api/v3/clients/orders/ (405 on
    // GET = exists), GET .../track/ (400 on dummy id = exists); the older
    // seller-pickup-request (/api/v1) + /api/v4 tracking paths 404 on this host.
    createOrder: '/api/v3/clients/orders/',
    cancelOrder: (id) => `/api/v3/clients/orders/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/api/v3/clients/orders/${encodeURIComponent(id)}/track/`,
    serviceability: '/api/v1/clients/serviceability/',
    health: '/api/v1/clients/serviceability/',
  },
  dale_production: {
    createOrder: '/api/v3/clients/orders/',
    cancelOrder: (id) => `/api/v3/clients/orders/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/api/v3/clients/orders/${encodeURIComponent(id)}/track/`,
    serviceability: '/api/v1/clients/serviceability/',
    health: '/api/v1/clients/serviceability/',
  },
  legacy: {
    createOrder: '/api/v2/orders/',
    cancelOrder: (id) => `/api/v2/orders/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/api/v2/orders/${encodeURIComponent(id)}/status/`,
    serviceability: '/api/v1/order-serviceability/',
    health: '/api/v1/order-serviceability/',
  },
  hl_staging: {
    createOrder: '/api/v2/orders/',
    cancelOrder: (id) => `/api/v2/orders/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/api/v2/orders/${encodeURIComponent(id)}/status/`,
    serviceability: '/api/v1/order-serviceability/',
    health: '/api/v1/order-serviceability/',
  },
  v3_marketplace: {
    createOrder: '/v3/clients/orders/',
    cancelOrder: (id) => `/v3/clients/orders/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/v3/clients/orders/${encodeURIComponent(id)}/track/`,
    serviceability: '/v1/clients/serviceability/',
    health: '/v1/clients/serviceability/',
  },
  v3_warehouse: {
    createOrder: '/v3/clients/shipments/',
    cancelOrder: (id) => `/v3/clients/shipments/${encodeURIComponent(id)}/cancel/`,
    trackOrder: (id) => `/v3/clients/shipments/${encodeURIComponent(id)}/track/`,
    serviceability: '/v1/clients/serviceability/',
    health: '/v1/clients/serviceability/',
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
