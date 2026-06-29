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
exports.AdminRiderController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rider_assignment_service_1 = require("../rider-assignment/rider-assignment.service");
const assign_rider_dto_1 = require("./dto/assign-rider.dto");
let AdminRiderController = class AdminRiderController {
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async getRiderQueue(page = 1, limit = 20) {
        const result = await this.assignmentService.listUnassignedOrders(Number(page), Number(limit));
        return {
            success: true,
            data: result.orders,
            meta: result.meta,
        };
    }
    async listAvailableRiders(storeId) {
        const data = await this.assignmentService.listAvailableRidersForStore(storeId);
        return { success: true, data };
    }
    async assignRider(user, orderId, dto, ip) {
        const data = await this.assignmentService.assign(orderId, dto.riderProfileId, user.id, ip);
        return { success: true, data };
    }
    async reassignRider(user, orderId, dto, ip) {
        const data = await this.assignmentService.reassign(orderId, dto.riderProfileId, user.id, ip);
        return { success: true, data };
    }
    async autoAssign(user, orderId) {
        const data = await this.assignmentService.autoAssign(orderId);
        if (!data) {
            return { success: false, data: null, message: 'No eligible riders found for auto-assignment' };
        }
        return { success: true, data };
    }
    async unassign(user, orderId, ip) {
        await this.assignmentService.unassign(orderId, user.id, ip);
        return { success: true };
    }
};
exports.AdminRiderController = AdminRiderController;
__decorate([
    (0, common_1.Get)('rider-queue'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get orders ready for rider assignment',
        description: 'Returns READY_FOR_PICKUP orders without an active rider assignment.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Order queue for rider assignment' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminRiderController.prototype, "getRiderQueue", null);
__decorate([
    (0, common_1.Get)('riders/available'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'List riders available for assignment to a store' }),
    (0, swagger_1.ApiQuery)({ name: 'storeId', required: true, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available riders ranked by zone match and distance' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminRiderController.prototype, "listAvailableRiders", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/assign-rider'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Manually assign a rider to a READY_FOR_PICKUP order',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rider assigned' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Order not ready or rider unavailable' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Order or rider not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_rider_dto_1.AssignRiderDto, String]),
    __metadata("design:returntype", Promise)
], AdminRiderController.prototype, "assignRider", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/reassign-rider'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reassign a delivery to a different rider',
        description: 'Cancels the current assignment (if ASSIGNED/ACCEPTED/ARRIVED_AT_STORE) and ' +
            'creates a new one for the specified rider.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rider reassigned' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_rider_dto_1.AssignRiderDto, String]),
    __metadata("design:returntype", Promise)
], AdminRiderController.prototype, "reassignRider", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/auto-assign'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({
        summary: 'Trigger auto-assignment for an order',
        description: 'Runs the scoring algorithm (same zone → online → fewest deliveries → nearest) ' +
            'and assigns the best available rider.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Auto-assignment result' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminRiderController.prototype, "autoAssign", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/unassign'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    (0, swagger_1.ApiOperation)({ summary: 'Unassign rider and return order to pickup queue' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminRiderController.prototype, "unassign", null);
exports.AdminRiderController = AdminRiderController = __decorate([
    (0, swagger_1.ApiTags)('admin / riders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [rider_assignment_service_1.RiderAssignmentService])
], AdminRiderController);
//# sourceMappingURL=admin-rider.controller.js.map