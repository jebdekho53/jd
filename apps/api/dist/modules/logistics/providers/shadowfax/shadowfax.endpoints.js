"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHADOWFAX_ENDPOINTS = void 0;
exports.shadowfaxEndpointsForMode = shadowfaxEndpointsForMode;
exports.SHADOWFAX_ENDPOINTS = {
    dale_staging: {
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
function shadowfaxEndpointsForMode(mode) {
    return exports.SHADOWFAX_ENDPOINTS[mode];
}
//# sourceMappingURL=shadowfax.endpoints.js.map