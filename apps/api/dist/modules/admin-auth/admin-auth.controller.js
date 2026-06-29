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
exports.AdminAuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const constants_1 = require("../../common/constants");
const admin_auth_service_1 = require("./admin-auth.service");
const admin_auth_dto_1 = require("./dto/admin-auth.dto");
let AdminAuthController = class AdminAuthController {
    constructor(adminAuth) {
        this.adminAuth = adminAuth;
    }
    async login(dto, ip, req) {
        const result = await this.adminAuth.login(dto, ip, req.headers['user-agent']);
        return { success: true, data: result };
    }
    async forgotPassword(dto) {
        const result = await this.adminAuth.forgotPassword(dto);
        return { success: true, data: result };
    }
    async resetPassword(dto, ip) {
        const result = await this.adminAuth.resetPassword(dto, ip);
        return { success: true, data: result };
    }
    async loginStats() {
        const data = await this.adminAuth.getLoginStats();
        return { success: true, data };
    }
    async me(user) {
        const data = await this.adminAuth.getMe(user.id);
        return { success: true, data };
    }
    async getSettings(user) {
        const data = await this.adminAuth.getSettingsForUser(user.id);
        return { success: true, data };
    }
    async updateSettings(user, dto, ip) {
        const data = await this.adminAuth.updateSettings(user.id, dto, ip);
        return { success: true, data };
    }
    async changePassword(user, dto, ip) {
        const data = await this.adminAuth.changePassword(user.id, dto, ip);
        return { success: true, data };
    }
    async sessions(user) {
        const data = await this.adminAuth.listSessions(user.id);
        return { success: true, data };
    }
    async revokeSession(user, sessionId) {
        const data = await this.adminAuth.revokeSession(user.id, sessionId);
        return { success: true, data };
    }
    async logoutAll(user, ip) {
        const data = await this.adminAuth.revokeAllSessions(user.id, ip);
        return { success: true, data };
    }
    async logout(user, dto, ip) {
        const data = await this.adminAuth.logout(user.id, dto.refreshToken, ip);
        return { success: true, data };
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 5, limit: 10 } }),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin email/password login' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminLoginDto, String, Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 10, limit: 5 } }),
    (0, common_1.Post)('forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Request admin password reset email' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 5, limit: 10 } }),
    (0, common_1.Post)('reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset admin password with token' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminResetPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "resetPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('login-stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Public platform stats for admin login page' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "loginStats", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Current admin profile' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "me", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin account settings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "getSettings", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update admin account settings' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_auth_dto_1.UpdateAdminSettingsDto, String]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "updateSettings", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Change admin password' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_auth_dto_1.AdminChangePasswordDto, String]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "changePassword", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'List active admin sessions' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "sessions", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a single admin session' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "revokeSession", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout from all devices' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "logoutAll", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Logout current session' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_auth_dto_1.AdminLogoutDto, String]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "logout", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.ADMIN),
    (0, common_1.Controller)('admin-auth'),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService])
], AdminAuthController);
//# sourceMappingURL=admin-auth.controller.js.map