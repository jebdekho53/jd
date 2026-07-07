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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BuyerController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const buyer_store_service_1 = require("./buyer-store.service");
const buyer_product_service_1 = require("./buyer-product.service");
const discover_stores_dto_1 = require("./dto/discover-stores.dto");
const store_products_dto_1 = require("./dto/store-products.dto");
const search_products_dto_1 = require("./dto/search-products.dto");
const compare_product_dto_1 = require("./dto/compare-product.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const step_up_guard_1 = require("../../common/guards/step-up.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const require_step_up_decorator_1 = require("../../common/decorators/require-step-up.decorator");
let BuyerController = BuyerController_1 = class BuyerController {
    constructor(storeService, productService, jwtService) {
        this.storeService = storeService;
        this.productService = productService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(BuyerController_1.name);
    }
    optionalUserId(req) {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            return undefined;
        try {
            const payload = this.jwtService.verify(header.slice(7));
            return payload.sub;
        }
        catch {
            return undefined;
        }
    }
    async discoverStores(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const { stores, total } = await this.storeService.discoverStores(dto);
        this.logger.log(`GET /buyer/stores → ${stores.length} stores (total=${total}, radiusKm=${dto.radiusKm ?? 5})`);
        return {
            success: true,
            data: stores,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getStore(slug) {
        const data = await this.storeService.getStoreBySlug(slug);
        return { success: true, data };
    }
    async getStoreProducts(slug, dto) {
        const storeDetail = await this.storeService.getStoreBySlug(slug);
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const { products, total } = await this.productService.listStoreProducts(storeDetail.id, dto);
        return {
            success: true,
            data: products,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async compareProduct(productId, dto) {
        const data = await this.productService.compareProduct(productId, dto);
        if (!data) {
            throw new common_1.NotFoundException('No comparable offers found for this product');
        }
        return { success: true, data };
    }
    async searchProducts(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const { products, total } = await this.productService.searchProducts(dto);
        return {
            success: true,
            data: products,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async searchProductsGrouped(dto) {
        const { groups, total } = await this.productService.searchProductsGrouped(dto);
        return { success: true, data: groups, meta: { total, storeCount: groups.length } };
    }
    async getProduct(id, storeSlug) {
        const data = await this.productService.getProductById(id, storeSlug);
        if (!data) {
            throw new common_1.NotFoundException('Product not found');
        }
        return { success: true, data };
    }
    async getProductOffers(id, req) {
        const userId = this.optionalUserId(req);
        const data = await this.productService.getProductOffers(id, userId);
        if (!data) {
            throw new common_1.NotFoundException('Product not found');
        }
        return { success: true, data };
    }
    async listCategoryStores(categoryId, dto, subcategoryId) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const { stores, total } = await this.storeService.listStoresForCategory(categoryId, {
            ...dto,
            subcategoryId,
        });
        return {
            success: true,
            data: stores,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async listCategories(storeId) {
        const data = await this.productService.listCategories(storeId);
        this.logger.log(`GET /buyer/categories storeId=${storeId ?? 'global'} → ${data.length} categories`);
        return { success: true, data };
    }
    async updateProfile(user, dto) {
        return { success: true, message: 'Profile updated successfully' };
    }
};
exports.BuyerController = BuyerController;
__decorate([
    (0, common_1.Get)('stores'),
    (0, swagger_1.ApiOperation)({
        summary: 'Discover APPROVED, active stores near a coordinate',
        description: 'Returns stores sorted by distance. Only APPROVED + isActive stores are returned. ' +
            'Each card includes an `isOpen` flag computed from today\'s store hours (IST).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of nearby stores' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [discover_stores_dto_1.DiscoverStoresDto]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "discoverStores", null);
__decorate([
    (0, common_1.Get)('stores/:slug'),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Store slug' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get full store detail including hours, service areas and category list',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Store detail' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Store not found or not approved' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "getStore", null);
__decorate([
    (0, common_1.Get)('stores/:slug/products'),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Store slug' }),
    (0, swagger_1.ApiOperation)({
        summary: 'List in-stock, active products for an approved store',
        description: 'Only returns products where isActive=true and at least one variant has inventory > 0.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, store_products_dto_1.StoreProductsDto]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "getStoreProducts", null);
__decorate([
    (0, common_1.Get)('compare/:productId'),
    (0, swagger_1.ApiParam)({ name: 'productId', description: 'Anchor product ID to compare across stores' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Compare prices for the same product across nearby stores',
        description: 'Finds matching products by name and unit near the buyer. Returns stores sorted by final payable price.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, compare_product_dto_1.CompareProductDto]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "compareProduct", null);
__decorate([
    (0, common_1.Get)('products/search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search products by name, brand, description or tags',
        description: 'Uses PostgreSQL full-text search via the productSearchIndex.searchText field. ' +
            'Optionally filter by categoryId or storeId.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_products_dto_1.SearchProductsDto]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Get)('products/search/grouped'),
    (0, swagger_1.ApiOperation)({ summary: 'Search products grouped by store (store-centric results)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_products_dto_1.SearchProductsDto]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "searchProductsGrouped", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a single in-stock product by ID',
        description: 'Returns one visible product with store info. Optionally narrow to a store via the `store` slug query param.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Product detail' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Product not found' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('store')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Get)('products/:id/offers'),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({
        summary: 'PDP offers bundle for a product',
        description: 'Returns store promotions, coupons, campaign offers, wallet cashback, Plus benefits, and free-delivery eligibility.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "getProductOffers", null);
__decorate([
    (0, common_1.Get)('categories/:categoryId/stores'),
    (0, swagger_1.ApiOperation)({ summary: 'List approved stores selling in a category near the buyer' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subcategoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, discover_stores_dto_1.DiscoverStoresDto, String]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "listCategoryStores", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({
        summary: 'List global categories (and optionally a store\'s custom categories)',
        description: 'Pass ?storeId= to include store-specific categories alongside global ones.',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, roles_decorator_1.Roles)('BUYER'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, step_up_guard_1.StepUpGuard),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update buyer profile (requires step-up)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BuyerController.prototype, "updateProfile", null);
exports.BuyerController = BuyerController = BuyerController_1 = __decorate([
    (0, swagger_1.ApiTags)('buyer'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('buyer'),
    __metadata("design:paramtypes", [buyer_store_service_1.BuyerStoreService,
        buyer_product_service_1.BuyerProductService,
        jwt_1.JwtService])
], BuyerController);
//# sourceMappingURL=buyer.controller.js.map