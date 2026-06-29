"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeHasFssaiOnFile = storeHasFssaiOnFile;
const client_1 = require("@prisma/client");
async function storeHasFssaiOnFile(prisma, storeId) {
    const product = await prisma.product.findFirst({
        where: {
            storeId,
            deletedAt: null,
            fssaiLicense: { not: null },
            NOT: { fssaiLicense: '' },
        },
        orderBy: { updatedAt: 'desc' },
        select: { fssaiLicense: true },
    });
    if (product?.fssaiLicense?.trim())
        return true;
    const doc = await prisma.storeVerificationDocument.findFirst({
        where: { storeId, documentType: client_1.StoreDocumentType.FSSAI_LICENSE },
        select: { id: true },
    });
    return Boolean(doc);
}
//# sourceMappingURL=store-fssai.util.js.map