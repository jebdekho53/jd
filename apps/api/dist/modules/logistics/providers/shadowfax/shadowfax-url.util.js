"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveShadowfaxApiMode = resolveShadowfaxApiMode;
exports.normalizeShadowfaxApiBase = normalizeShadowfaxApiBase;
exports.shadowfaxRequestTarget = shadowfaxRequestTarget;
function resolveShadowfaxApiMode(apiUrl, explicitMode) {
    const mode = (explicitMode ?? '').trim().toLowerCase();
    if (mode === 'flash' || mode === 'hyperlocal' || mode === 'hl')
        return 'flash';
    if (mode === 'v3' || mode === 'warehouse' || mode === 'ecommerce')
        return 'v3';
    const host = apiUrl.toLowerCase();
    if (host.includes('flash-api.shadowfax') ||
        host.includes('hlbackend') ||
        host.includes('hyperlocal')) {
        return 'flash';
    }
    return 'v3';
}
function normalizeShadowfaxApiBase(apiUrl) {
    let base = apiUrl.trim().replace(/\/$/, '');
    base = base.replace(/\/api\/v3\/?$/i, '');
    return base;
}
function shadowfaxRequestTarget(baseUrl, path) {
    try {
        const host = new URL(baseUrl).host;
        return `${host}${path.startsWith('/') ? path : `/${path}`}`;
    }
    catch {
        return path;
    }
}
//# sourceMappingURL=shadowfax-url.util.js.map