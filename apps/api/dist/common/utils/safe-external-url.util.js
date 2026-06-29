"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSafeExternalHttpsUrl = assertSafeExternalHttpsUrl;
exports.assertSafeExternalHttpsUrls = assertSafeExternalHttpsUrls;
const common_1 = require("@nestjs/common");
const net_1 = require("net");
const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file):/i;
function isBlockedHost(hostname) {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost'))
        return true;
    if (host === 'metadata.google.internal' || host === 'metadata')
        return true;
    if ((0, net_1.isIP)(host)) {
        if (host === '127.0.0.1' || host === '0.0.0.0' || host === '::1')
            return true;
        if (host.startsWith('10.'))
            return true;
        if (host.startsWith('192.168.'))
            return true;
        if (host.startsWith('169.254.'))
            return true;
        const parts = host.split('.').map(Number);
        if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
            return true;
    }
    return false;
}
function assertSafeExternalHttpsUrl(url) {
    const trimmed = url?.trim();
    if (!trimmed) {
        throw new common_1.BadRequestException('URL is required');
    }
    if (BLOCKED_SCHEMES.test(trimmed)) {
        throw new common_1.BadRequestException('Invalid URL scheme');
    }
    let parsed;
    try {
        parsed = new URL(trimmed);
    }
    catch {
        throw new common_1.BadRequestException('Invalid URL');
    }
    if (parsed.protocol !== 'https:') {
        throw new common_1.BadRequestException('URLs must use HTTPS');
    }
    if (isBlockedHost(parsed.hostname)) {
        throw new common_1.BadRequestException('URL host is not allowed');
    }
}
function assertSafeExternalHttpsUrls(urls) {
    for (const url of urls ?? []) {
        assertSafeExternalHttpsUrl(url);
    }
}
//# sourceMappingURL=safe-external-url.util.js.map