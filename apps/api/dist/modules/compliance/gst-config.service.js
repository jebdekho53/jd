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
const hsn_code_util_1 = require("../product/hsn-code.util");
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
        const normalizedQuery = query?.trim();
        const numericPrefixCodes = normalizedQuery && /^\d{4}(\d{2}){0,2}$/.test(normalizedQuery)
            ? [normalizedQuery, normalizedQuery.slice(0, 6), normalizedQuery.slice(0, 4)]
                .filter((code, index, all) => code.length >= 4 && all.indexOf(code) === index)
            : [];
        return this.prisma.hSNCode.findMany({
            where: normalizedQuery
                ? {
                    isActive: true,
                    OR: [
                        ...(numericPrefixCodes.length > 0 ? [{ code: { in: numericPrefixCodes } }] : []),
                        { code: { contains: normalizedQuery } },
                        { description: { contains: normalizedQuery, mode: 'insensitive' } },
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
        const effectiveHsnCodeId = data.hsnCodeId === undefined ? product.hsnCodeId : data.hsnCodeId;
        if (!effectiveHsnCodeId?.trim()) {
            throw new common_1.BadRequestException('HSN code is required for every product');
        }
        if (data.hsnCodeId !== undefined) {
            const hsn = await this.prisma.hSNCode.findFirst({
                where: { id: data.hsnCodeId.trim(), isActive: true },
                select: { code: true },
            });
            if (!hsn) {
                throw new common_1.BadRequestException('Selected HSN code is invalid or inactive');
            }
            if (!(0, hsn_code_util_1.isValidHsnCode)(hsn.code)) {
                throw new common_1.BadRequestException('HSN code must be numeric and 4, 6, or 8 digits');
            }
        }
        return this.prisma.product.update({
            where: { id: productId },
            data: {
                hsnCodeId: data.hsnCodeId?.trim(),
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