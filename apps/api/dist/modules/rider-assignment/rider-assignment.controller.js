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
exports.RiderAssignmentController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const rider_assignment_service_1 = require("./rider-assignment.service");
const assign_rider_dto_1 = require("./dto/assign-rider.dto");
let RiderAssignmentController = class RiderAssignmentController {
    constructor(assignment) {
        this.assignment = assignment;
    }
    async listUnassigned(page = 1, limit = 20) {
        const data = await this.assignment.listUnassignedOrders(Number(page), Number(limit));
        return { success: true, ...data };
    }
    async listRiders(status) {
        const data = await this.assignment.listLiveRiders({ status });
        return { success: true, data };
    }
    async metrics() {
        const data = await this.assignment.getMetrics();
        return { success: true, data };
    }
    async availableRiders(storeId) {
        const data = await this.assignment.getAvailableRiders(storeId);
        return { success: true, data };
    }
    async assign(user, orderId, dto, ip) {
        const data = await this.assignment.assign(orderId, dto.riderProfileId, user.id, ip);
        return { success: true, data };
    }
    async reassign(user, orderId, dto, ip) {
        const data = await this.assignment.reassign(orderId, dto.riderProfileId, user.id, ip);
        return { success: true, data };
    }
    async autoAssign(orderId) {
        const data = await this.assignment.autoAssign(orderId);
        if (!data) {
            return { success: false, data: null, message: 'No eligible riders found' };
        }
        return { success: true, data };
    }
    async unassign(user, orderId, ip) {
        await this.assignment.unassign(orderId, user.id, ip);
        return { success: true };
    }
};
exports.RiderAssignmentController = RiderAssignmentController;
__decorate([
    (0, common_1.Get)('unassigned'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Orders needing rider assignment' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "listUnassigned", null);
__decorate([
    (0, common_1.Get)('riders'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Live rider operations board' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['ONLINE', 'OFFLINE', 'BUSY', 'SUSPENDED'] }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "listRiders", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Rider assignment metrics' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "metrics", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, swagger_1.ApiQuery)({ name: 'storeId', required: true }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "availableRiders", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/assign-rider'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_rider_dto_1.AssignRiderDto, String]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/reassign-rider'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_rider_dto_1.AssignRiderDto, String]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "reassign", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/auto-assign'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "autoAssign", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/unassign'),
    (0, permissions_decorator_1.Permissions)('orders:manage'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiParam)({ name: 'orderId' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RiderAssignmentController.prototype, "unassign", null);
exports.RiderAssignmentController = RiderAssignmentController = __decorate([
    (0, swagger_1.ApiTags)('admin / rider-assignments'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/rider-assignments'),
    __metadata("design:paramtypes", [rider_assignment_service_1.RiderAssignmentService])
], RiderAssignmentController);
//# sourceMappingURL=rider-assignment.controller.js.map