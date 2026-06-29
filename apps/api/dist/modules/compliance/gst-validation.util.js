"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GSTIN_REGEX = void 0;
exports.isValidGstin = isValidGstin;
exports.gstinStateCode = gstinStateCode;
exports.normalizeGstin = normalizeGstin;
exports.GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
function isValidGstin(gstin) {
    if (!gstin)
        return false;
    return exports.GSTIN_REGEX.test(gstin.trim().toUpperCase());
}
function gstinStateCode(gstin) {
    if (!isValidGstin(gstin))
        return null;
    return gstin.trim().slice(0, 2);
}
function normalizeGstin(gstin) {
    return gstin.trim().toUpperCase();
}
//# sourceMappingURL=gst-validation.util.js.map