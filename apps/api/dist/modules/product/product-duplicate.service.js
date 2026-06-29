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
exports.ProductDuplicateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ProductDuplicateService = class ProductDuplicateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loadStoreProductIndex(storeId) {
        const products = await this.prisma.product.findMany({
            where: { storeId, deletedAt: null },
            select: { id: true, name: true, brand: true, unit: true, sku: true },
        });
        const bySku = new Map();
        const byIdentity = new Map();
        for (const p of products) {
            if (p.sku) {
                bySku.set(p.sku.trim().toLowerCase(), { id: p.id, name: p.name });
            }
            byIdentity.set(this.identityKey(p.name, p.brand, p.unit), {
                id: p.id,
                name: p.name,
            });
        }
        return { bySku, byIdentity };
    }
    checkDuplicate(index, input) {
        if (input.sku?.trim()) {
            const hit = index.bySku.get(input.sku.trim().toLowerCase());
            if (hit) {
                return {
                    type: 'sku',
                    existingProductId: hit.id,
                    existingProductName: hit.name,
                    message: `Duplicate SKU "${input.sku}" — update existing product "${hit.name}" (${hit.id}) instead`,
                };
            }
        }
        const identityKey = this.identityKey(input.name, input.brand, input.unit);
        const identityHit = index.byIdentity.get(identityKey);
        if (identityHit) {
            return {
                type: 'identity',
                existingProductId: identityHit.id,
                existingProductName: identityHit.name,
                message: `Duplicate product (same name, brand, unit) — update existing product "${identityHit.name}" (${identityHit.id}) instead`,
            };
        }
        return null;
    }
    identityKey(name, brand, unit) {
        return `${this.norm(name)}::${this.norm(brand ?? '')}::${this.norm(unit ?? 'piece')}`;
    }
    norm(value) {
        return value.trim().toLowerCase();
    }
};
exports.ProductDuplicateService = ProductDuplicateService;
exports.ProductDuplicateService = ProductDuplicateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductDuplicateService);
//# sourceMappingURL=product-duplicate.service.js.map