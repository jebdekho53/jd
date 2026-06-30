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
    if (mode === 'flash' || mode === 'hyperlocal' || mode === 'hl')
        return 'flash';
    if (mode === 'v3_warehouse' || mode === 'warehouse')
        return 'v3_warehouse';
    if (mode === 'v3_marketplace' || mode === 'marketplace' || mode === 'ecommerce' || mode === 'v3') {
        return 'v3_marketplace';
    }
    const host = apiUrl.toLowerCase();
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
    if (mode === 'flash')
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