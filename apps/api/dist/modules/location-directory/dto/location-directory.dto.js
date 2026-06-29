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
exports.ImportLocationsDto = exports.SetLocationActiveDto = exports.ValidatePincodeDto = exports.ListAdminLocationsDto = exports.SearchLocationsDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class SearchLocationsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { q: { required: true, type: () => String, minLength: 1 }, cityId: { required: false, type: () => String }, districtId: { required: false, type: () => String }, pincode: { required: false, type: () => String }, limit: { required: false, type: () => Number, minimum: 1, maximum: 50 } };
    }
}
exports.SearchLocationsDto = SearchLocationsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SearchLocationsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchLocationsDto.prototype, "cityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchLocationsDto.prototype, "districtId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchLocationsDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], SearchLocationsDto.prototype, "limit", void 0);
class ListAdminLocationsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { q: { required: false, type: () => String }, cityId: { required: false, type: () => String }, districtId: { required: false, type: () => String }, pincode: { required: false, type: () => String }, page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 200 } };
    }
}
exports.ListAdminLocationsDto = ListAdminLocationsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminLocationsDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminLocationsDto.prototype, "cityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminLocationsDto.prototype, "districtId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListAdminLocationsDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListAdminLocationsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], ListAdminLocationsDto.prototype, "limit", void 0);
class ValidatePincodeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { pincode: { required: true, type: () => String }, locationCityId: { required: false, type: () => String }, locationAreaId: { required: false, type: () => String } };
    }
}
exports.ValidatePincodeDto = ValidatePincodeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePincodeDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePincodeDto.prototype, "locationCityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePincodeDto.prototype, "locationAreaId", void 0);
class SetLocationActiveDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { isActive: { required: true, type: () => Boolean } };
    }
}
exports.SetLocationActiveDto = SetLocationActiveDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetLocationActiveDto.prototype, "isActive", void 0);
class ImportLocationsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { csv: { required: true, type: () => String } };
    }
}
exports.ImportLocationsDto = ImportLocationsDto;
//# sourceMappingURL=location-directory.dto.js.map