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
exports.MerchantAnalyticsQueryDto = exports.AnalyticsExportQueryDto = exports.AnalyticsSalesQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class AnalyticsSalesQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { granularity: { required: false, type: () => String, enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'] }, compare: { required: false, type: () => String, enum: ['today_yesterday', 'week', 'month'] } };
    }
}
exports.AnalyticsSalesQueryDto = AnalyticsSalesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
    __metadata("design:type", String)
], AnalyticsSalesQueryDto.prototype, "granularity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['today_yesterday', 'week', 'month'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['today_yesterday', 'week', 'month']),
    __metadata("design:type", String)
], AnalyticsSalesQueryDto.prototype, "compare", void 0);
class AnalyticsExportQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { format: { required: false, type: () => Object, enum: ['csv', 'xlsx', 'pdf'] }, range: { required: false, type: () => Object, enum: ['today', 'yesterday', '7d', '30d', '90d', 'custom'] }, type: { required: false, type: () => String }, from: { required: false, type: () => String }, to: { required: false, type: () => String } };
    }
}
exports.AnalyticsExportQueryDto = AnalyticsExportQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['csv', 'xlsx', 'pdf'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['csv', 'xlsx', 'pdf']),
    __metadata("design:type", String)
], AnalyticsExportQueryDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['today', 'yesterday', '7d', '30d', '90d', 'custom'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['today', 'yesterday', '7d', '30d', '90d', 'custom']),
    __metadata("design:type", String)
], AnalyticsExportQueryDto.prototype, "range", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsExportQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsExportQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnalyticsExportQueryDto.prototype, "to", void 0);
class MerchantAnalyticsQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { storeId: { required: true, type: () => String }, period: { required: false, type: () => Object, enum: ['7d', '30d'] } };
    }
}
exports.MerchantAnalyticsQueryDto = MerchantAnalyticsQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MerchantAnalyticsQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['7d', '30d'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['7d', '30d']),
    __metadata("design:type", String)
], MerchantAnalyticsQueryDto.prototype, "period", void 0);
//# sourceMappingURL=analytics-query.dto.js.map