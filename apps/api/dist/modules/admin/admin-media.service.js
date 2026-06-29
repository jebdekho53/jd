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
exports.AdminMediaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
let AdminMediaService = class AdminMediaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCoverageReport() {
        const [productsMissing, storesMissingLogo, storesMissingBanner, categoriesMissing] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    deletedAt: null,
                    OR: [{ imageUrls: { equals: [] } }, { imageUrls: { isEmpty: true } }],
                },
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    isActive: true,
                    store: { select: { name: true } },
                },
                take: 200,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.store.findMany({
                where: { deletedAt: null, logoUrl: null },
                select: { id: true, name: true, status: true },
                take: 200,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.store.findMany({
                where: { deletedAt: null, bannerUrl: null },
                select: { id: true, name: true, status: true },
                take: 200,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.category.findMany({
                where: {
                    deletedAt: null,
                    scope: client_1.CategoryScope.GLOBAL,
                    storeId: null,
                    imageUrl: null,
                },
                select: {
                    id: true,
                    name: true,
                    parentId: true,
                    isActive: true,
                    parent: { select: { name: true } },
                },
                take: 200,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const [productCount, storeLogoCount, storeBannerCount, categoryCount,] = await Promise.all([
            this.prisma.product.count({
                where: {
                    deletedAt: null,
                    OR: [{ imageUrls: { equals: [] } }, { imageUrls: { isEmpty: true } }],
                },
            }),
            this.prisma.store.count({ where: { deletedAt: null, logoUrl: null } }),
            this.prisma.store.count({ where: { deletedAt: null, bannerUrl: null } }),
            this.prisma.category.count({
                where: {
                    deletedAt: null,
                    scope: client_1.CategoryScope.GLOBAL,
                    storeId: null,
                    imageUrl: null,
                },
            }),
        ]);
        return {
            totals: {
                productsWithoutImages: productCount,
                storesWithoutLogo: storeLogoCount,
                storesWithoutBanner: storeBannerCount,
                categoriesWithoutImages: categoryCount,
            },
            samples: {
                products: productsMissing,
                storesMissingLogo,
                storesMissingBanner,
                categories: categoriesMissing,
            },
        };
    }
};
exports.AdminMediaService = AdminMediaService;
exports.AdminMediaService = AdminMediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminMediaService);
//# sourceMappingURL=admin-media.service.js.map