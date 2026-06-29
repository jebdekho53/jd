"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryComplianceText = categoryComplianceText;
exports.isHsnRequiredCategory = isHsnRequiredCategory;
exports.isFssaiRequiredCategory = isFssaiRequiredCategory;
exports.isTaxComplianceCategory = isTaxComplianceCategory;
exports.isPublicProductImageUrl = isPublicProductImageUrl;
exports.hasProductBuyerComplianceGaps = hasProductBuyerComplianceGaps;
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
function isPublicProductImageUrl(url) {
    if (!url?.trim())
        return false;
    try {
        const u = new URL(url);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
            return false;
        return u.protocol === 'https:';
    }
    catch {
        return false;
    }
}
function hasProductBuyerComplianceGaps(input) {
    if (!isPublicProductImageUrl(input.imageUrls[0]))
        return true;
    if (!input.categoryId || !input.category)
        return true;
    const taxCategory = input.taxCategory ?? 'GOODS';
    if (isTaxComplianceCategory(input.category, taxCategory) &&
        !input.hsnCodeId) {
        return true;
    }
    if (isFssaiRequiredCategory(input.category)) {
        const onProduct = input.fssaiLicense?.trim();
        const inherited = input.storeFssaiLicense?.trim();
        if (!onProduct && !inherited)
            return true;
    }
    return false;
}
//# sourceMappingURL=product-compliance.util.js.map