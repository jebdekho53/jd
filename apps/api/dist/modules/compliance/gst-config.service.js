"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let GstConfigService = class GstConfigService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listTaxRates() {
        return this.prisma.taxRate.findMany({ where: { isActive: true }, orderBy: { totalRate: 'asc' } });
    }
    async listJurisdictions() {
        return this.prisma.taxJurisdiction.findMany({ where: { isActive: true }, orderBy: { stateName: 'asc' } });
    }
    async listHsnCodes(query) {
        return this.prisma.hSNCode.findMany({
            where: query
                ? {
                    isActive: true,
                    OR: [
                        { code: { contains: query } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                }
                : { isActive: true },
            orderBy: { code: 'asc' },
            take: 100,
        });
    }
    async updateProductTax(productId, storeId, data) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, storeId },
        });
        if (!product)
            return null;
        return this.prisma.product.update({
            where: { id: productId },
            data: {
                hsnCodeId: data.hsnCodeId,
                gstSlab: data.gstSlab,
                taxCategory: data.taxCategory,
                taxInclusive: data.taxInclusive,
            },
            include: { hsnCodeRef: true },
        });
    }
};
exports.GstConfigService = GstConfigService;
exports.GstConfigService = GstConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GstConfigService);
//# sourceMappingURL=gst-config.service.js.map