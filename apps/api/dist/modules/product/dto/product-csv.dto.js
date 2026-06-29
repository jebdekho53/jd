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
exports.ProductCsvValidateRowDto = exports.ProductCsvImportDto = exports.ProductCsvBodyDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ProductCsvBodyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { csv: { required: true, type: () => String } };
    }
}
exports.ProductCsvBodyDto = ProductCsvBodyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw CSV content' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProductCsvBodyDto.prototype, "csv", void 0);
class ProductCsvImportDto extends ProductCsvBodyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rowNumbers: { required: true, type: () => [Number], minimum: 1 } };
    }
}
exports.ProductCsvImportDto = ProductCsvImportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1-based row numbers from validation preview to import',
        type: [Number],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], ProductCsvImportDto.prototype, "rowNumbers", void 0);
class ProductCsvValidateRowDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { rowNumber: { required: true, type: () => Number }, valid: { required: true, type: () => Boolean }, errors: { required: true, type: () => [String] }, preview: { required: true, type: () => Object } };
    }
}
exports.ProductCsvValidateRowDto = ProductCsvValidateRowDto;
//# sourceMappingURL=product-csv.dto.js.map