"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryComplianceText = categoryComplianceText;
exports.isHsnRequiredCategory = isHsnRequiredCategory;
exports.isFssaiRequiredCategory = isFssaiRequiredCategory;
exports.isTaxComplianceCategory = isTaxComplianceCategory;
const HSN_CATEGORY_RE = /grocery|food|dairy|beverage|snack|packaged|fruit|vegetable|meat|fish|bakery|sweet/i;
const FSSAI_CATEGORY_RE = /grocery|dairy|beverage|snack|packaged|fruit|vegetable|meat|fish|bakery|sweet/i;
const FSSAI_EXCLUDE_RE = /supplement|nutrition|personal-care|electronics|beauty|mobile|appliance|stationery|fashion|pharmacy|pet/i;
function categoryComplianceText(category) {
    return `${category.slug} ${category.name}`;
}
function isHsnRequiredCategory(category) {
    return HSN_CATEGORY_RE.test(categoryComplianceText(category));
}
function isFssaiRequiredCategory(category) {
    const text = categoryComplianceText(category);
    if (FSSAI_EXCLUDE_RE.test(text))
        return false;
    return FSSAI_CATEGORY_RE.test(text);
}
function isTaxComplianceCategory(category, taxCategory) {
    if (taxCategory === 'EXEMPT' || taxCategory === 'NIL_RATED')
        return false;
    return isHsnRequiredCategory(category);
}
//# sourceMappingURL=product-compliance.util.js.map