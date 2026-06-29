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
exports.RiderController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const delivery_service_1 = require("./delivery.service");
const rider_location_service_1 = require("./rider-location.service");
const rider_assignment_service_1 = require("../rider-assignment/rider-assignment.service");
const prisma_service_1 = require("../../database/prisma.service");
const update_rider_location_dto_1 = require("./dto/update-rider-location.dto");
const update_rider_status_dto_1 = require("./dto/update-rider-status.dto");
const fail_delivery_dto_1 = require("./dto/fail-delivery.dto");
let RiderController = class RiderController {
    constructor(deliveryService, locationService, assignmentService, prisma) {
        this.deliveryService = deliveryService;
        this.locationService = locationService;
        this.assignmentService = assignmentService;
        this.prisma = prisma;
    }
    async updateStatus(user, dto) {
        const riderProfile = await this.deliveryService.requireRiderProfile(user.id);
        await this.prisma.riderProfile.update({
            where: { id: riderProfile.id },
            data: { status: dto.status },
        });
        return { success: true, data: { status: dto.status } };
    }
    async updateLocation(user, dto) {
        const riderProfile = await this.deliveryService.requireRiderProfile(user.id);
        await this.locationService.updateLocation(riderProfile.id, dto);
        return { success: true, data: { latitude: dto.latitude, longitude: dto.longitude } };
    }
    async listOrders(user) {
        const data = await this.deliveryService.getRiderDeliveries(user.id);
        return { success: true, data };
    }
    async getOrder(user, orderId) {
        const data = await this.deliveryService.getRiderDeliveryByOrderId(user.id, orderId);
        return { success: true, data };
    }
    async acceptDelivery(user, orderId, ip) {
        const data = await this.deliveryService.acceptDelivery(user.id, orderId, ip);
        return { success: true, data };
    }
    async rejectDelivery(user, orderId) {
        await this.assignmentService.rejectOffer(user.id, orderId);
        return { success: true };
    }
    async arrivedAtStore(user, orderId, ip) {
        const data = await this.deliveryService.arrivedAtStore(user.id, orderId, ip);
        return { success: true, data };
    }
    async pickedUp(user, orderId, ip) {
        const data = await this.deliveryService.pickedUp(user.id, orderId, ip);
        return { success: true, data };
    }
    async arrivedAtCustomer(user, orderId, ip) {
        const data = await this.deliveryService.arrivedAtCustomer(user.id, orderId, ip);
        return { success: true, data };
    }
    async markDelivered(user, orderId, ip) {
        const data = await this.deliveryService.markDelivered(user.id, orderId, ip);
        return { success: true, data };
    }
    async markFailed(user, orderId, dto, ip) {
        const data = await this.deliveryService.markFailed(user.id, orderId, dto.reason, ip);
        return { success: true, data };
    }
};
exports.RiderController = RiderController;
__decorate([
    (0, common_1.Patch)('status'),
    (0, permissions_decorator_1.Permissions)('rider:status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle rider availability (ONLINE / OFFLINE)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_rider_status_dto_1.UpdateRiderStatusDto]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('location'),
    (0, permissions_decorator_1.Permissions)('rider:location'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update rider GPS location — cached 60s in Redis, history in Postgres' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location updated' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_rider_location_dto_1.UpdateRiderLocationDto]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, permissions_decorator_1.Permissions)('deliveries:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Rider delivery queue — all deliveries assigned to this rider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of deliveries' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    (0, permissions_decorator_1.Permissions)('deliveries:read'),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get delivery detail for a specific order' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Delivery detail' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/accept'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Accept delivery (ASSIGNED → ACCEPTED)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Delivery accepted' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Delivery not in ASSIGNED status' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Delivery not assigned to this rider' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "acceptDelivery", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/reject'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Reject delivery offer (within offer window)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "rejectDelivery", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/arrived-store'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Mark arrived at store (ACCEPTED → ARRIVED_AT_STORE)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "arrivedAtStore", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/picked-up'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Mark order picked up from store (ARRIVED_AT_STORE → PICKED_UP)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "pickedUp", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/arrived-customer'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Mark arrived at customer (PICKED_UP → ARRIVED_AT_CUSTOMER)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "arrivedAtCustomer", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/delivered'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm delivery (ARRIVED_AT_CUSTOMER → DELIVERED)' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "markDelivered", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/failed'),
    (0, permissions_decorator_1.Permissions)('deliveries:update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark delivery as failed — any non-terminal status → FAILED',
        description: 'Releases rider back to ONLINE and marks order as DELIVERY_FAILED.',
    }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, fail_delivery_dto_1.FailDeliveryDto, String]),
    __metadata("design:returntype", Promise)
], RiderController.prototype, "markFailed", null);
exports.RiderController = RiderController = __decorate([
    (0, swagger_1.ApiTags)('rider'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('RIDER'),
    (0, common_1.Controller)('rider'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService,
        rider_location_service_1.RiderLocationService,
        rider_assignment_service_1.RiderAssignmentService,
        prisma_service_1.PrismaService])
], RiderController);
//# sourceMappingURL=rider.controller.js.map