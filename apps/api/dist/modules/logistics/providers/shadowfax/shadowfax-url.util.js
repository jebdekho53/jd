"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveShadowfaxApiMode = resolveShadowfaxApiMode;
exports.normalizeShadowfaxApiBase = normalizeShadowfaxApiBase;
exports.shadowfaxRequestUrl = shadowfaxRequestUrl;
exports.shadowfaxRequestPath = shadowfaxRequestPath;
exports.maskShadowfaxToken = maskShadowfaxToken;
exports.assertSupportedShadowfaxPath = assertSupportedShadowfaxPath;
exports.shadowfaxRequestTarget = shadowfaxRequestTarget;
function resolveShadowfaxApiMode(apiUrl, explicitMode) {
    const mode = (explicitMode ?? '').trim().toLowerCase();
    if (mode === 'dale_staging' || mode === 'staging')
        return 'dale_staging';
    if (mode === 'dale_production' || mode === 'production' || mode === 'prod')
        return 'dale_production';
    if (mode === 'hl_staging')
        return 'hl_staging';
    if (mode === 'legacy' || mode === 'hl_marketplace' || mode === 'v2')
        return 'legacy';
    if (mode === 'flash' || mode === 'hyperlocal' || mode === 'hl')
        return 'flash';
    if (mode === 'v3_warehouse' || mode === 'warehouse')
        return 'v3_warehouse';
    if (mode === 'v3_marketplace' || mode === 'marketplace' || mode === 'ecommerce' || mode === 'v3') {
        return 'v3_marketplace';
    }
    const host = apiUrl.toLowerCase();
    if (host.includes('dale.staging.shadowfax.in')) {
        return 'dale_staging';
    }
    if (host.includes('dale.shadowfax.in')) {
        return 'dale_production';
    }
    if (host.includes('hlbackend.staging.shadowfax.in')) {
        return 'hl_staging';
    }
    if (host.includes('api.shadowfax.in')) {
        return 'legacy';
    }
    if (host.includes('flash-api.shadowfax') ||
        host.includes('hlbackend') ||
        host.includes('hyperlocal')) {
        return 'flash';
    }
    return 'v3_marketplace';
}
function normalizeShadowfaxApiBase(apiUrl, mode = 'v3_marketplace') {
    let base = apiUrl.trim().replace(/\/$/, '');
    if (!base)
        return '';
    if (mode === 'dale_staging' || mode === 'dale_production' || mode === 'legacy' || mode === 'hl_staging') {
        return base
            .replace(/\/api\/v2\/?$/i, '')
            .replace(/\/api\/v1\/?$/i, '')
            .replace(/\/api\/?$/i, '');
    }
    if (mode === 'flash')
        return base.replace(/\/api\/v3\/?$/i, '').replace(/\/api\/?$/i, '');
    base = base
        .replace(/\/api\/api\/?$/i, '/api')
        .replace(/\/api\/v3\/?$/i, '')
        .replace(/\/v3\/?$/i, '')
        .replace(/\/api\/?$/i, '');
    base = base.replace(/\/$/, '');
    return `${base}/api`;
}
function joinPath(basePath, path) {
    const cleanBase = basePath.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
}
function shadowfaxRequestUrl(baseUrl, path) {
    const base = baseUrl.replace(/\/$/, '');
    return joinPath(base, path);
}
function shadowfaxRequestPath(baseUrl, path) {
    try {
        const url = new URL(shadowfaxRequestUrl(baseUrl, path));
        return url.pathname;
    }
    catch {
        return path.startsWith('/') ? path : `/${path}`;
    }
}
function maskShadowfaxToken(token) {
    if (!token)
        return '(not set)';
    if (token.length <= 8)
        return '****';
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
function assertSupportedShadowfaxPath(mode, path) {
    if (mode === 'flash' || mode === 'dale_staging' || mode === 'dale_production' || mode === 'legacy' || mode === 'hl_staging')
        return;
    if (path.includes('/api/')) {
        throw new Error(`Shadowfax endpoint path must be relative to /api base: ${path}`);
    }
    if (mode === 'v3_marketplace' && path.includes('/clients/shipments/')) {
        throw new Error(`Shadowfax marketplace mode cannot use warehouse shipment endpoint: ${path}`);
    }
}
function shadowfaxRequestTarget(baseUrl, path) {
    try {
        const url = new URL(shadowfaxRequestUrl(baseUrl, path));
        return `${url.host}${url.pathname}`;
    }
    catch {
        return path;
    }
}
//# sourceMappingURL=shadowfax-url.util.js.map