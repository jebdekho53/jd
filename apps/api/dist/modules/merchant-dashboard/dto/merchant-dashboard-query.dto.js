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
exports.MerchantDashboardAnalyticsQueryDto = exports.MerchantDashboardOrdersQueryDto = exports.MerchantDashboardStoreQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class MerchantDashboardStoreQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: false, type: () => String } };
    }
}
exports.MerchantDashboardStoreQueryDto = MerchantDashboardStoreQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter metrics to a single store' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MerchantDashboardStoreQueryDto.prototype, "storeId", void 0);
class MerchantDashboardOrdersQueryDto extends MerchantDashboardStoreQueryDto {
    constructor() {
        super(...arguments);
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { tab: { required: false, type: () => String }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 } };
    }
}
exports.MerchantDashboardOrdersQueryDto = MerchantDashboardOrdersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Order status tab',
        enum: [
            'NEW',
            'ACTIVE',
            'ACCEPTED',
            'PREPARING',
            'READY_FOR_PICKUP',
            'RIDER_ASSIGNED',
            'OUT_FOR_DELIVERY',
            'CANCELLED',
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MerchantDashboardOrdersQueryDto.prototype, "tab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MerchantDashboardOrdersQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MerchantDashboardOrdersQueryDto.prototype, "limit", void 0);
class MerchantDashboardAnalyticsQueryDto extends MerchantDashboardStoreQueryDto {
    constructor() {
        super(...arguments);
        this.period = '7d';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { period: { required: false, type: () => Object, default: "7d" } };
    }
}
exports.MerchantDashboardAnalyticsQueryDto = MerchantDashboardAnalyticsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['7d', '30d'], default: '7d' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MerchantDashboardAnalyticsQueryDto.prototype, "period", void 0);
//# sourceMappingURL=merchant-dashboard-query.dto.js.map