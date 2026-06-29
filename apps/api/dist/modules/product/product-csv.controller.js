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
exports.ProductCsvController = void 0;
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
const product_csv_service_1 = require("./product-csv.service");
const product_csv_dto_1 = require("./dto/product-csv.dto");
const STORE_PARAM = ':storeId';
let ProductCsvController = class ProductCsvController {
    constructor(csvService) {
        this.csvService = csvService;
    }
    getTemplate() {
        return this.csvService.getTemplate();
    }
    async validate(user, storeId, body) {
        const data = await this.csvService.validateCsv(user.id, storeId, body.csv);
        return { success: true, data };
    }
    async importCsv(user, storeId, body, ip) {
        const data = await this.csvService.importCsv(user.id, storeId, body.csv, body.rowNumbers, ip);
        return { success: true, data };
    }
};
exports.ProductCsvController = ProductCsvController;
__decorate([
    (0, common_1.Get)('template'),
    (0, permissions_decorator_1.Permissions)('products:read'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="product-import-template.csv"'),
    (0, swagger_1.ApiOperation)({ summary: 'Download product CSV import template' }),
    openapi.ApiResponse({ status: 200, type: String }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductCsvController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Validate CSV rows before import (free)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, product_csv_dto_1.ProductCsvBodyDto]),
    __metadata("design:returntype", Promise)
], ProductCsvController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('products:write'),
    (0, swagger_1.ApiParam)({ name: 'storeId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Import validated CSV rows (free)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('storeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, product_csv_dto_1.ProductCsvImportDto, String]),
    __metadata("design:returntype", Promise)
], ProductCsvController.prototype, "importCsv", null);
exports.ProductCsvController = ProductCsvController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.MERCHANTS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('MERCHANT'),
    (0, common_1.Controller)(`merchant/stores/${STORE_PARAM}/products/csv`),
    __metadata("design:paramtypes", [product_csv_service_1.ProductCsvService])
], ProductCsvController);
//# sourceMappingURL=product-csv.controller.js.map