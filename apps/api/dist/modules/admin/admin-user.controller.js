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
exports.AdminUserController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const step_up_guard_1 = require("../../common/guards/step-up.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const require_step_up_decorator_1 = require("../../common/decorators/require-step-up.decorator");
const constants_1 = require("../../common/constants");
const admin_user_service_1 = require("./admin-user.service");
const list_admin_users_dto_1 = require("./dto/list-admin-users.dto");
const suspend_admin_user_dto_1 = require("./dto/suspend-admin-user.dto");
let AdminUserController = class AdminUserController {
    constructor(users) {
        this.users = users;
    }
    async list(dto) {
        const result = await this.users.listUsers(dto);
        return { success: true, ...result };
    }
    async suspend(id, _dto) {
        const data = await this.users.suspendUser(id);
        return { success: true, data };
    }
    async deleteUser(id) {
        await this.users.deleteUser(id);
        return { success: true, message: 'User deleted successfully' };
    }
};
exports.AdminUserController = AdminUserController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('users:read'),
    (0, swagger_1.ApiOperation)({ summary: 'List platform users with optional role/search filters' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_admin_users_dto_1.ListAdminUsersDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':id/suspend'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('users:write'),
    (0, common_1.UseGuards)(step_up_guard_1.StepUpGuard),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend a platform user' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, suspend_admin_user_dto_1.SuspendAdminUserDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "suspend", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, permissions_decorator_1.Permissions)('users:write'),
    (0, common_1.UseGuards)(step_up_guard_1.StepUpGuard),
    (0, require_step_up_decorator_1.RequireStepUp)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a platform user' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "deleteUser", null);
exports.AdminUserController = AdminUserController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [admin_user_service_1.AdminUserService])
], AdminUserController);
//# sourceMappingURL=admin-user.controller.js.map