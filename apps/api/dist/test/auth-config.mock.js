"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthConfigMock = createAuthConfigMock;
function createAuthConfigMock(overrides = {}) {
    const defaults = {
        NODE_ENV: 'test',
        AUTH_EMAIL_ENABLED: 'true',
        AUTH_PHONE_OTP_ENABLED: 'true',
        AUTH_SMS_ENABLED: 'true',
        AUTH_WHATSAPP_ENABLED: 'false',
        MSG91_ENABLED: 'false',
        SMS_PROVIDER: 'console',
        JWT_PRIVATE_KEY: '',
        JWT_PUBLIC_KEY: '',
    };
    return {
        get: jest.fn((key, defaultValue) => {
            if (key in overrides)
                return overrides[key];
            if (key in defaults)
                return defaults[key];
            return defaultValue;
        }),
    };
}
//# sourceMappingURL=auth-config.mock.js.map