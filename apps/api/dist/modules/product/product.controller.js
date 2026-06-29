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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const constants_1 = require("../../common/constants");
const product_service_1 = require("./product.service");
const category_service_1 = require("./category.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
const update_price_dto_1 = require("./dto/update-price.dto");
const update_status_dto_1 = require("./dto/update-status.dto");
const list_products_dto_1 = require("./dto/list-products.dto");
const category_dto_1 = require("./dto/category.dto");
const STORE_PARAM = ':storeId';
let ProductController = class ProductController {
    constructor(productService, categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }
    async listCategories(user, storeId) {
        const data = await this.categoryService.listCategories(storeId, user.id);
        return { success: true, data };
    }
    async createCategory(user, storeId, dto) {
        const data = await this.categoryService.createCategory(user.id, storeId, dto);
        return { success: true, data };
    }
    async updateCategory(user, storeId, categoryId, dto) {
        const data = await this.categoryService.updateCategory(user.id, storeId, categoryId, dto);
        return { success: true, data };
    }
    async createProduct(user, storeId, dto, ip) {
        const data = await this.productService.createProduct(user.id, storeId, dto, ip);
        return { success: true, data };
    }
    async listProducts(user, storeId, query) {
        const { products, total } = await this.productService.listProducts(user.id, storeId, query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        return {
            success: true,
            data: products,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async getProduct(user, storeId, productId) {
        const data = await this.productService.getProduct(user.id, storeId, productId);
        return { success: true, data };
    }
    async updateProduct(user, storeId, productId, dto, ip) {
        const data = await this.productService.updateProduct(user.id, storeId, productId, dto, ip);
        return { success: true, data };
    }
    async deleteProduct(user, storeId, productId, ip) {
        await this.productService.deleteProduct(user.id, storeId, productId, ip);
        return { success: true, data: { message: 'Product deleted' } };
    }
    async updateInventory(user, storeId, productId, variantId, dto, ip) {
        const vid = await this.resolveVariantId(productId, variantId);
        const data = await this.productService.updateInventory(user.id, storeId, productId, vid, dto, ip);
        return { success: true, data };
    }
    async updatePrice(user, storeId, productId, variantId, dto, ip) {
        const vid = await this.resolveVariantId(productId, variantId);
        const data = await this.productService.updatePrice(user.id, storeId, productId, vid, dto, ip);
        return { success: true, data };
    }
    async updateStatus(user, storeId, productId, dto, ip) {
        const data = await this.productService.updateStatus(user.id, storeId, productId, dto, ip);
        return { success: true, data };
    }
    async resolveVariantId(productId, variantId) {
        if (variantId)
            return variantId;
        return this.productService.resolveDefaultVariantId(productId);
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Get)('categories'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'List approved categories for product creation' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a store-specific category' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:categoryId'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'categoryId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a store-specific category' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('categoryId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new product with default variant + inventory' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Product created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Price > MRP or duplicate SKU' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_product_dto_1.CreateProductDto, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'List products with pagination, status and category filters' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, list_products_dto_1.ListProductsDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get product detail with all variants and inventory' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update product fields (name, description, images, price…)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_product_dto_1.UpdateProductDto, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete product (removed from buyer view immediately)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Patch)('products/:id/inventory'),
    (0, permissions_decorator_1.Permissions)('inventory:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update stock for the default variant. For multi-variant products pass ?variantId=',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Query)('variantId')),
    __param(4, (0, common_1.Body)()),
    __param(5, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, update_inventory_dto_1.UpdateInventoryDto, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateInventory", null);
__decorate([
    (0, common_1.Patch)('products/:id/price'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update selling price (and optional MRP) for default or specific variant',
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Query)('variantId')),
    __param(4, (0, common_1.Body)()),
    __param(5, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, update_price_dto_1.UpdatePriceDto, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updatePrice", null);
__decorate([
    (0, common_1.Patch)('products/:id/status'),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Product ID' }),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle product active/inactive status' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_status_dto_1.UpdateProductStatusDto, String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateStatus", null);
exports.ProductController = ProductController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.PRODUCTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)(`merchant/stores/${STORE_PARAM}`),
    __metadata("design:paramtypes", [product_service_1.ProductService,
        category_service_1.CategoryService])
], ProductController);
//# sourceMappingURL=product.controller.js.map