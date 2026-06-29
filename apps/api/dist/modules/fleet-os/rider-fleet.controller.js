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
exports.RiderFleetController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const constants_1 = require("../../common/constants");
const prisma_service_1 = require("../../database/prisma.service");
const batching_service_1 = require("./batching.service");
const route_optimization_service_1 = require("./route-optimization.service");
let RiderFleetController = class RiderFleetController {
    constructor(prisma, batching, routes) {
        this.prisma = prisma;
        this.batching = batching;
        this.routes = routes;
    }
    async riderId(userId) {
        const profile = await this.prisma.riderProfile.findUnique({ where: { userId } });
        return profile?.id;
    }
    async queue(user) {
        const riderId = await this.riderId(user.id);
        if (!riderId)
            return { success: true, data: null };
        const batch = await this.batching.getRiderBatch(riderId);
        return {
            success: true,
            data: {
                currentBatch: batch,
                upcomingOrders: batch?.items.filter((i) => i.sequence > 1) ?? [],
            },
        };
    }
    async route(user) {
        const riderId = await this.riderId(user.id);
        if (!riderId)
            return { success: true, data: null };
        const route = await this.routes.getLatestForRider(riderId);
        return { success: true, data: route };
    }
};
exports.RiderFleetController = RiderFleetController;
__decorate([
    (0, common_1.Get)('queue'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RiderFleetController.prototype, "queue", null);
__decorate([
    (0, common_1.Get)('route'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RiderFleetController.prototype, "route", null);
exports.RiderFleetController = RiderFleetController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.RIDERS),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('RIDER'),
    (0, common_1.Controller)('rider/fleet'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        batching_service_1.BatchingService,
        route_optimization_service_1.RouteOptimizationService])
], RiderFleetController);
//# sourceMappingURL=rider-fleet.controller.js.map