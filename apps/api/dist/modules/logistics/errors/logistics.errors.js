"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderNotImplementedError = exports.ProviderNotEnabledError = exports.LogisticsProviderError = void 0;
class LogisticsProviderError extends Error {
    constructor(message, providerType, code, retryable = false, cause, opts) {
        super(message);
        this.providerType = providerType;
        this.code = code;
        this.retryable = retryable;
        this.cause = cause;
        this.name = 'LogisticsProviderError';
        this.providerStatusCode = opts?.providerStatusCode;
        this.providerMessage = opts?.providerMessage;
    }
}
exports.LogisticsProviderError = LogisticsProviderError;
class ProviderNotEnabledError extends LogisticsProviderError {
    constructor(providerType) {
        super(`Provider ${providerType} is not enabled`, providerType, 'PROVIDER_NOT_ENABLED', false);
        this.name = 'ProviderNotEnabledError';
    }
}
exports.ProviderNotEnabledError = ProviderNotEnabledError;
class ProviderNotImplementedError extends LogisticsProviderError {
    constructor(providerType) {
        super(`Provider ${providerType} is not implemented yet`, providerType, 'NOT_IMPLEMENTED', false);
        this.name = 'ProviderNotImplementedError';
    }
}
exports.ProviderNotImplementedError = ProviderNotImplementedError;
//# sourceMappingURL=logistics.errors.js.map