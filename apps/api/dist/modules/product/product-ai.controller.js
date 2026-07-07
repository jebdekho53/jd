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
exports.ProductAiController = void 0;
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
const product_ai_service_1 = require("./product-ai.service");
const product_ai_dto_1 = require("./dto/product-ai.dto");
const STORE_PARAM = ':storeId';
let ProductAiController = class ProductAiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async availability(user, _storeId) {
        const data = await this.aiService.getAvailability(user.id);
        return { success: true, data };
    }
    async billing(user, storeId, page, limit) {
        const data = await this.aiService.listBilling(user.id, storeId, page ? Number(page) : 1, limit ? Number(limit) : 50);
        return { success: true, data };
    }
    async analyze(user, storeId, dto, ip) {
        const data = await this.aiService.analyzeImage(user.id, storeId, dto.dataUrl, ip);
        return { success: true, data };
    }
    async history(user, storeId, query) {
        const data = await this.aiService.listHistory(user.id, query.storeId ?? storeId, query.page, query.limit);
        return { success: true, data };
    }
    async getAnalysis(user, storeId, analysisId) {
        const data = await this.aiService.getAnalysis(user.id, storeId, analysisId);
        return { success: true, data };
    }
    async confirm(user, storeId, analysisId, dto, ip) {
        const data = await this.aiService.confirmAnalysis(user.id, storeId, analysisId, dto, ip);
        return { success: true, data };
    }
    async generateImage(user, storeId, analysisId, dto, ip) {
        const mode = dto.mode === 'ai_edit' ? 'ai_edit' : 'bg_removal';
        const data = await this.aiService.generateProductImage(user.id, storeId, analysisId, mode, ip);
        return { success: true, data };
    }
    async cancel(user, storeId, analysisId, ip) {
        const data = await this.aiService.cancelAnalysis(user.id, storeId, analysisId, ip);
        return { success: true, data };
    }
};
exports.ProductAiController = ProductAiController;
__decorate([
    (0, common_1.Get)('availability'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Check if AI product add is available' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "availability", null);
__decorate([
    (0, common_1.Get)('billing'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'AI product billing history for store' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "billing", null);
__decorate([
    (0, common_1.Post)('analyze'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze product photo with AI (free preview)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, product_ai_dto_1.AnalyzeProductImageDto, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "analyze", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'List AI product analysis history for merchant' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, product_ai_dto_1.ListAiHistoryDto]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "history", null);
__decorate([
    (0, common_1.Get)(':analysisId'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'analysisId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI analysis result' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('analysisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "getAnalysis", null);
__decorate([
    (0, common_1.Post)(':analysisId/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'analysisId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm AI suggestions and create product (paid)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('analysisId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, product_ai_dto_1.ConfirmAiProductDto, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':analysisId/generate-image'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'analysisId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a professional product image with AI (paid per image)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('analysisId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, product_ai_dto_1.GenerateProductImageDto, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "generateImage", null);
__decorate([
    (0, common_1.Post)(':analysisId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiParam)({ name: 'analysisId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel AI analysis without charge' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Param)('analysisId')),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ProductAiController.prototype, "cancel", null);
exports.ProductAiController = ProductAiController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)(`merchant/stores/${STORE_PARAM}/products/ai`),
    __metadata("design:paramtypes", [product_ai_service_1.ProductAiService])
], ProductAiController);
//# sourceMappingURL=product-ai.controller.js.map