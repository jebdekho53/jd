"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDemoPhone = isDemoPhone;
exports.isDemoEmail = isDemoEmail;
exports.isDemoAuthRequest = isDemoAuthRequest;
exports.getDemoConfig = getDemoConfig;
const configuration_1 = require("../../config/configuration");
function normalizePhoneDigits(phone) {
    return phone.replace(/\D/g, '').slice(-10);
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function isDemoPhone(phone, cfg) {
    if (cfg.nodeEnv === 'production')
        return false;
    const digits = normalizePhoneDigits(phone);
    const demoDigits = [
        cfg.dev.demoPhone,
        cfg.dev.demoMerchantPhone,
        cfg.dev.demoMerchantPhone2,
        cfg.dev.demoAdminPhone,
        cfg.dev.demoRiderPhone,
    ].map(normalizePhoneDigits);
    return demoDigits.includes(digits);
}
function isDemoEmail(email, cfg) {
    if (cfg.nodeEnv === 'production')
        return false;
    const normalized = normalizeEmail(email);
    const demoEmails = [
        cfg.dev.demoMerchantEmail,
        cfg.dev.demoMerchantEmail2,
        cfg.dev.demoAdminEmail,
    ]
        .filter(Boolean)
        .map(normalizeEmail);
    return demoEmails.includes(normalized);
}
function isDemoAuthRequest(body, cfg) {
    if (!body || cfg.nodeEnv === 'production')
        return false;
    if (body.phone && isDemoPhone(body.phone, cfg))
        return true;
    if (body.email && isDemoEmail(body.email, cfg))
        return true;
    return false;
}
function getDemoConfig(configService) {
    return (0, configuration_1.getConfig)(configService);
}
//# sourceMappingURL=demo-auth.util.js.map