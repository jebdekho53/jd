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
exports.GeoController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const constants_1 = require("../../common/constants");
const geo_service_1 = require("./geo.service");
let GeoController = class GeoController {
    constructor(geoService) {
        this.geoService = geoService;
    }
    async listCities() {
        const data = await this.geoService.listCities();
        return { success: true, data };
    }
    async listZones(cityId) {
        const data = await this.geoService.listZonesByCity(cityId);
        return { success: true, data };
    }
};
exports.GeoController = GeoController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('cities'),
    (0, swagger_1.ApiOperation)({ summary: 'List active cities for store onboarding' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "listCities", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('cities/:cityId/zones'),
    (0, swagger_1.ApiOperation)({ summary: 'List delivery zones for a city' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('cityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeoController.prototype, "listZones", null);
exports.GeoController = GeoController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.HEALTH),
    (0, common_1.Controller)('geo'),
    __metadata("design:paramtypes", [geo_service_1.GeoService])
], GeoController);
//# sourceMappingURL=geo.controller.js.map