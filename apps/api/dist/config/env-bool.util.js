"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envBool = envBool;
function envBool(configService, key, defaultValue) {
    const raw = configService.get(key);
    if (raw === undefined || raw === '')
        return defaultValue;
    return raw === 'true' || raw === '1';
}
//# sourceMappingURL=env-bool.util.js.map