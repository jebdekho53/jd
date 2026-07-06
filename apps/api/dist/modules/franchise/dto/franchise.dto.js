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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignTerritoryDto = exports.CreateCityLaunchDto = exports.UpdateFranchiseDto = exports.CreateFranchiseDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateFranchiseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String }, businessName: { required: true, type: () => String }, gstin: { required: false, type: () => String }, pan: { required: false, type: () => String }, cityId: { required: false, type: () => String }, commissionPercent: { required: false, type: () => Number } };
    }
}
exports.CreateFranchiseDto = CreateFranchiseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFranchiseDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFranchiseDto.prototype, "businessName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFranchiseDto.prototype, "gstin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFranchiseDto.prototype, "pan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFranchiseDto.prototype, "cityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateFranchiseDto.prototype, "commissionPercent", void 0);
class UpdateFranchiseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, commissionPercent: { required: false, type: () => Number }, onboardingCompleted: { required: false, type: () => Boolean } };
    }
}
exports.UpdateFranchiseDto = UpdateFranchiseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof client_1.FranchisePartnerStatus !== "undefined" && client_1.FranchisePartnerStatus) === "function" ? _a : Object)
], UpdateFranchiseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateFranchiseDto.prototype, "commissionPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFranchiseDto.prototype, "onboardingCompleted", void 0);
class CreateCityLaunchDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { city: { required: true, type: () => String }, state: { required: true, type: () => String }, launchStatus: { required: false, type: () => Object }, targetStores: { required: false, type: () => Number }, targetRiders: { required: false, type: () => Number }, targetGmv: { required: false, type: () => Number } };
    }
}
exports.CreateCityLaunchDto = CreateCityLaunchDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCityLaunchDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCityLaunchDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof client_1.CityLaunchStatus !== "undefined" && client_1.CityLaunchStatus) === "function" ? _b : Object)
], CreateCityLaunchDto.prototype, "launchStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCityLaunchDto.prototype, "targetStores", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCityLaunchDto.prototype, "targetRiders", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCityLaunchDto.prototype, "targetGmv", void 0);
class AssignTerritoryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { city: { required: true, type: () => String }, state: { required: true, type: () => String }, pincodes: { required: true, type: () => [String] }, exclusivityEnabled: { required: false, type: () => Boolean } };
    }
}
exports.AssignTerritoryDto = AssignTerritoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignTerritoryDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignTerritoryDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AssignTerritoryDto.prototype, "pincodes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AssignTerritoryDto.prototype, "exclusivityEnabled", void 0);
//# sourceMappingURL=franchise.dto.js.map