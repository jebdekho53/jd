"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWsCorsOrigins = resolveWsCorsOrigins;
exports.wsGatewayCorsOptions = wsGatewayCorsOptions;
const DEV_WS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:3004',
    'http://127.0.0.1:3004',
];
function resolveWsCorsOrigins() {
    const raw = process.env.CORS_ORIGINS ?? '';
    const configured = raw
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    if (configured.length > 0)
        return configured;
    if (process.env.NODE_ENV === 'production') {
        return [
            'https://jebdekho.com',
            'https://www.jebdekho.com',
            'https://admin.jebdekho.com',
            'https://merchant.jebdekho.com',
            'https://rider.jebdekho.com',
            'https://vendor.jebdekho.com',
            'https://franchise.jebdekho.com',
        ];
    }
    return DEV_WS_ORIGINS;
}
function wsGatewayCorsOptions() {
    return {
        origin: resolveWsCorsOrigins(),
        credentials: true,
    };
}
//# sourceMappingURL=ws-cors.util.js.map