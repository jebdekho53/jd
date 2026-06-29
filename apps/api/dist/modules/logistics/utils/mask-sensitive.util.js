"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskSensitivePayload = maskSensitivePayload;
const SENSITIVE_KEYS = new Set([
    'token',
    'authorization',
    'client_secret',
    'client_id',
    'password',
    'secret',
    'api_key',
    'webhook_secret',
    'credits_key',
]);
function maskSensitivePayload(value) {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value)) {
        return value.map((item) => maskSensitivePayload(item));
    }
    if (typeof value === 'object') {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            if (SENSITIVE_KEYS.has(key.toLowerCase())) {
                out[key] = '[REDACTED]';
            }
            else {
                out[key] = maskSensitivePayload(val);
            }
        }
        return out;
    }
    return value;
}
//# sourceMappingURL=mask-sensitive.util.js.map