"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('Sentry');
function initSentry() {
    const dsn = process.env.SENTRY_DSN?.trim();
    if (!dsn)
        return;
    try {
        const Sentry = require('@sentry/nestjs');
        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV ?? 'development',
            tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
        });
        logger.log('Sentry initialized');
    }
    catch {
        logger.warn('SENTRY_DSN is set but @sentry/nestjs is not installed — skipping error tracking');
    }
}
//# sourceMappingURL=sentry.js.map