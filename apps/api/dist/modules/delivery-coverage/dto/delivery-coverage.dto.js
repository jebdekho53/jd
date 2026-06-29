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
exports.CsvImportRowDto = exports.AdminCoverageSearchDto = exports.ListDeliveryAreasDto = exports.UpdateDeliveryAreaDto = exports.BulkAddDeliveryAreasDto = exports.AddDeliveryAreaDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AddDeliveryAreaDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { pincode: { required: true, type: () => String, minLength: 6, maxLength: 6, pattern: "/^\\d{6}$/" }, deliveryFee: { required: false, type: () => Number, minimum: 0 }, minimumOrder: { required: false, type: () => Number, minimum: 0 }, estimatedMinutes: { required: false, type: () => Number, minimum: 1, maximum: 180 }, priority: { required: false, type: () => Number, minimum: 0, maximum: 100 } };
    }
}
exports.AddDeliveryAreaDto = AddDeliveryAreaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '201206' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    (0, class_validator_1.Matches)(/^\d{6}$/),
    __metadata("design:type", String)
], AddDeliveryAreaDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddDeliveryAreaDto.prototype, "deliveryFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddDeliveryAreaDto.prototype, "minimumOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], AddDeliveryAreaDto.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AddDeliveryAreaDto.prototype, "priority", void 0);
class BulkAddDeliveryAreasDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { pincodes: { required: true, type: () => [String] } };
    }
}
exports.BulkAddDeliveryAreasDto = BulkAddDeliveryAreasDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['201206', '201204'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkAddDeliveryAreasDto.prototype, "pincodes", void 0);
class UpdateDeliveryAreaDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { deliveryFee: { required: false, type: () => Number, minimum: 0 }, minimumOrder: { required: false, type: () => Number, minimum: 0 }, estimatedMinutes: { required: false, type: () => Number, minimum: 1, maximum: 180 }, priority: { required: false, type: () => Number, minimum: 0, maximum: 100 }, isActive: { required: false, type: () => Boolean } };
    }
}
exports.UpdateDeliveryAreaDto = UpdateDeliveryAreaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDeliveryAreaDto.prototype, "deliveryFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDeliveryAreaDto.prototype, "minimumOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], UpdateDeliveryAreaDto.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateDeliveryAreaDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDeliveryAreaDto.prototype, "isActive", void 0);
class ListDeliveryAreasDto {
    constructor() {
        this.page = 1;
        this.limit = 50;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { search: { required: false, type: () => String }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 50, minimum: 1, maximum: 200 } };
    }
}
exports.ListDeliveryAreasDto = ListDeliveryAreasDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListDeliveryAreasDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListDeliveryAreasDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], ListDeliveryAreasDto.prototype, "limit", void 0);
class AdminCoverageSearchDto {
    constructor() {
        this.page = 1;
        this.limit = 50;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { pincode: { required: false, type: () => String }, city: { required: false, type: () => String }, page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 50, minimum: 1, maximum: 200 } };
    }
}
exports.AdminCoverageSearchDto = AdminCoverageSearchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCoverageSearchDto.prototype, "pincode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminCoverageSearchDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AdminCoverageSearchDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], AdminCoverageSearchDto.prototype, "limit", void 0);
class CsvImportRowDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { pincode: { required: true, type: () => String, minLength: 6, maxLength: 6 }, deliveryFee: { required: false, type: () => Number, minimum: 0 }, minimumOrder: { required: false, type: () => Number, minimum: 0 }, estimatedMinutes: { required: false, type: () => Number, minimum: 1 }, priority: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.CsvImportRowDto = CsvImportRowDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], CsvImportRowDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CsvImportRowDto.prototype, "deliveryFee", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CsvImportRowDto.prototype, "minimumOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CsvImportRowDto.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CsvImportRowDto.prototype, "priority", void 0);
//# sourceMappingURL=delivery-coverage.dto.js.map