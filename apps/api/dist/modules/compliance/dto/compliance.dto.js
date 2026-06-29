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
exports.SyncTdsTcsDto = exports.UpdateProductTaxDto = exports.ExportComplianceQueryDto = exports.ListComplianceQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
class ListComplianceQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, default: 1, minimum: 1 }, limit: { required: false, type: () => Number, default: 20, minimum: 1, maximum: 100 }, month: { required: false, type: () => String, pattern: "/^\\d{4}-\\d{2}$/" } };
    }
}
exports.ListComplianceQueryDto = ListComplianceQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListComplianceQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ListComplianceQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/, { message: 'month must be YYYY-MM' }),
    __metadata("design:type", String)
], ListComplianceQueryDto.prototype, "month", void 0);
class ExportComplianceQueryDto extends ListComplianceQueryDto {
    constructor() {
        super(...arguments);
        this.format = 'csv';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { format: { required: false, type: () => Object, default: "csv" } };
    }
}
exports.ExportComplianceQueryDto = ExportComplianceQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportComplianceQueryDto.prototype, "format", void 0);
class UpdateProductTaxDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { hsnCodeId: { required: false, type: () => String }, gstSlab: { required: false, type: () => Object }, taxCategory: { required: false, type: () => Object }, taxInclusive: { required: false, type: () => Boolean } };
    }
}
exports.UpdateProductTaxDto = UpdateProductTaxDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductTaxDto.prototype, "hsnCodeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.GstSlab),
    __metadata("design:type", String)
], UpdateProductTaxDto.prototype, "gstSlab", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['GOODS', 'SERVICES', 'EXEMPT', 'NIL_RATED']),
    __metadata("design:type", String)
], UpdateProductTaxDto.prototype, "taxCategory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateProductTaxDto.prototype, "taxInclusive", void 0);
class SyncTdsTcsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { periodMonth: { required: true, type: () => String, pattern: "/^\\d{4}-\\d{2}$/" } };
    }
}
exports.SyncTdsTcsDto = SyncTdsTcsDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}$/),
    __metadata("design:type", String)
], SyncTdsTcsDto.prototype, "periodMonth", void 0);
//# sourceMappingURL=compliance.dto.js.map