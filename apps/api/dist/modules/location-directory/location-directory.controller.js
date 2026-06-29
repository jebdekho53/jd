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
exports.LocationDirectoryController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const constants_1 = require("../../common/constants");
const location_directory_service_1 = require("./location-directory.service");
const location_directory_dto_1 = require("./dto/location-directory.dto");
let LocationDirectoryController = class LocationDirectoryController {
    constructor(locations) {
        this.locations = locations;
    }
    async search(query) {
        const data = await this.locations.search(query);
        return { success: true, data };
    }
    async filters() {
        const data = await this.locations.listFilters();
        return { success: true, data };
    }
    async byPincode(pincode) {
        const data = await this.locations.getByPincode(pincode);
        return { success: true, data };
    }
    async bySlug(slug) {
        const data = await this.locations.getBySlug(slug);
        return { success: true, data };
    }
};
exports.LocationDirectoryController = LocationDirectoryController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search master location directory (aliases, pincodes, areas)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [location_directory_dto_1.SearchLocationsDto]),
    __metadata("design:returntype", Promise)
], LocationDirectoryController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('filters'),
    (0, swagger_1.ApiOperation)({ summary: 'List states, districts, cities for filters' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocationDirectoryController.prototype, "filters", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('pincodes/:pincode'),
    (0, swagger_1.ApiOperation)({ summary: 'Lookup all post offices for a pincode' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('pincode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LocationDirectoryController.prototype, "byPincode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('slugs/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve SEO slug to location' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LocationDirectoryController.prototype, "bySlug", null);
exports.LocationDirectoryController = LocationDirectoryController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.HEALTH),
    (0, common_1.Controller)('locations'),
    __metadata("design:paramtypes", [location_directory_service_1.LocationDirectoryService])
], LocationDirectoryController);
//# sourceMappingURL=location-directory.controller.js.map