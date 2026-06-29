"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogKindForStoreBusinessTypes = catalogKindForStoreBusinessTypes;
exports.resolveStoreCatalogKind = resolveStoreCatalogKind;
const client_1 = require("@prisma/client");
const vertical_constants_1 = require("../../food/vertical.constants");
function catalogKindForStoreBusinessTypes(businessTypes) {
    const hasFood = businessTypes.some((t) => (0, vertical_constants_1.isFoodVertical)(t));
    const hasProduct = businessTypes.some((t) => !(0, vertical_constants_1.isFoodVertical)(t) && t !== client_1.VerticalBusinessType.LOCAL_STORE);
    if (hasFood && !hasProduct)
        return client_1.CategoryCatalogKind.MENU;
    if (hasProduct && !hasFood)
        return client_1.CategoryCatalogKind.PRODUCT;
    return client_1.CategoryCatalogKind.PRODUCT;
}
async function resolveStoreCatalogKind(prisma, storeId, explicit) {
    if (explicit)
        return explicit;
    const approved = await prisma.storeBusinessType.findMany({
        where: { storeId, status: client_1.StoreBusinessTypeStatus.APPROVED },
        select: { businessType: true },
    });
    if (approved.length > 0) {
        return catalogKindForStoreBusinessTypes(approved.map((r) => r.businessType));
    }
    const pending = await prisma.storeBusinessType.findMany({
        where: { storeId, status: client_1.StoreBusinessTypeStatus.PENDING },
        select: { businessType: true },
    });
    if (pending.length > 0) {
        return catalogKindForStoreBusinessTypes(pending.map((r) => r.businessType));
    }
    return client_1.CategoryCatalogKind.PRODUCT;
}
//# sourceMappingURL=catalog-kind.util.js.map