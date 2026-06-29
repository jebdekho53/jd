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
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const constants_1 = require("../../common/constants");
const auth_service_1 = require("./auth.service");
const request_otp_dto_1 = require("./dto/request-otp.dto");
const verify_otp_dto_1 = require("./dto/verify-otp.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const logout_dto_1 = require("./dto/logout.dto");
const signup_dto_1 = require("./dto/signup.dto");
const login_dto_1 = require("./dto/login.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async requestOtp(dto, ip) {
        const result = await this.authService.requestOtp(dto, ip);
        return {
            success: true,
            data: result,
        };
    }
    async sendOtp(dto, ip) {
        return this.requestOtp(dto, ip);
    }
    async verifyOtp(dto, ip, req) {
        const result = await this.authService.verifyOtp(dto, ip, req.headers['user-agent']);
        return {
            success: true,
            data: result,
        };
    }
    async signup(dto, ip, req) {
        const result = await this.authService.signup(dto, ip, req.headers['user-agent']);
        return { success: true, data: result };
    }
    async login(dto, ip, req) {
        const result = await this.authService.login(dto, ip, req.headers['user-agent']);
        return { success: true, data: result };
    }
    async forgotPassword(dto) {
        const result = await this.authService.forgotPassword(dto);
        return { success: true, data: result };
    }
    async resetPassword(dto) {
        const result = await this.authService.resetPassword(dto);
        return { success: true, data: result };
    }
    async refresh(dto, ip, req) {
        const tokens = await this.authService.refresh(dto, ip, req.headers['user-agent']);
        return {
            success: true,
            data: tokens,
        };
    }
    async logout(user, dto, ip, req) {
        await this.authService.logout(user.id, dto.refreshToken, ip, req.headers['user-agent']);
        return {
            success: true,
            data: { message: 'Logged out successfully' },
        };
    }
    async logoutAll(user, ip, req) {
        const result = await this.authService.logoutAll(user.id, ip, req.headers['user-agent']);
        return {
            success: true,
            data: result,
        };
    }
    async me(user) {
        const profile = await this.authService.getMe(user.id);
        return {
            success: true,
            data: profile,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 10, limit: 3 } }),
    (0, common_1.Post)('request-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a 6-digit OTP via SMS' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OTP dispatched' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many OTP requests' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_otp_dto_1.RequestOtpDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 10, limit: 3 } }),
    (0, common_1.Post)('send-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Alias for request-otp' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_otp_dto_1.RequestOtpDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 5, limit: 10 } }),
    (0, common_1.Post)('verify-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP — auto-registers if new user, issues JWT pair' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tokens issued' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired OTP' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_otp_dto_1.VerifyOtpDto, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 10, limit: 5 } }),
    (0, common_1.Post)('signup'),
    (0, swagger_1.ApiOperation)({ summary: 'Register with email and password' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.CREATED }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_dto_1.EmailSignupDto, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 5, limit: 10 } }),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.EmailLoginDto, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 10, limit: 3 } }),
    (0, common_1.Post)('forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset via email link or mobile OTP' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000 * 5, limit: 10 } }),
    (0, common_1.Post)('reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password with email token or mobile OTP' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 20 } }),
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Rotate refresh token — returns new access + refresh pair' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New token pair issued' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid, expired, or reused refresh token' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke current device session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session revoked' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, logout_dto_1.LogoutDto, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('logout-all'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke all sessions for this user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All sessions revoked' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Ip)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current user' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Not authenticated' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)(constants_1.ApiTags.AUTH),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map