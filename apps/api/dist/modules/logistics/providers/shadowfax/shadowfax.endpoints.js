"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHADOWFAX_ENDPOINTS = void 0;
exports.shadowfaxEndpointsForMode = shadowfaxEndpointsForMode;
exports.SHADOWFAX_ENDPOINTS = {
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
function shadowfaxEndpointsForMode(mode) {
    return exports.SHADOWFAX_ENDPOINTS[mode];
}
//# sourceMappingURL=shadowfax.endpoints.js.map