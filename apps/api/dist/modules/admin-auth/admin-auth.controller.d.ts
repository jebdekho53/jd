import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { AdminAuthService } from './admin-auth.service';
import { AdminChangePasswordDto, AdminForgotPasswordDto, AdminLoginDto, AdminLogoutDto, AdminResetPasswordDto, UpdateAdminSettingsDto } from './dto/admin-auth.dto';
export declare class AdminAuthController {
    private readonly adminAuth;
    constructor(adminAuth: AdminAuthService);
    login(dto: AdminLoginDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            user: {
                id: any;
                phone: any;
                email: any;
                status: any;
                phoneVerified: any;
                roles: any;
                permissions: string[];
                createdAt: any;
                adminProfile: {
                    name: any;
                    department: any;
                    isSuperAdmin: any;
                } | null;
            };
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            rememberMe?: boolean;
        };
    }>;
    forgotPassword(dto: AdminForgotPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    resetPassword(dto: AdminResetPasswordDto, ip: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    loginStats(): Promise<{
        success: boolean;
        data: {
            activeStores: any;
            totalOrders: any;
            activeRiders: any;
            merchants: any;
        };
    }>;
    me(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: any;
            phone: any;
            email: any;
            status: any;
            phoneVerified: any;
            roles: any;
            permissions: string[];
            createdAt: any;
            adminProfile: {
                name: any;
                department: any;
                isSuperAdmin: any;
            } | null;
        };
    }>;
    getSettings(user: RequestUser): Promise<{
        success: boolean;
        data: {
            name: any;
            email: any;
            phone: any;
            department: any;
            credentialSource: any;
            lastLoginAt: any;
            passwordChangedAt: any;
        };
    }>;
    updateSettings(user: RequestUser, dto: UpdateAdminSettingsDto, ip: string): Promise<{
        success: boolean;
        data: {
            name: any;
            email: any;
            phone: any;
            department: any;
            credentialSource: any;
            lastLoginAt: any;
            passwordChangedAt: any;
        };
    }>;
    changePassword(user: RequestUser, dto: AdminChangePasswordDto, ip: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    sessions(user: RequestUser): Promise<{
        success: boolean;
        data: any;
    }>;
    revokeSession(user: RequestUser, sessionId: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
        };
    }>;
    logoutAll(user: RequestUser, ip: string): Promise<{
        success: boolean;
        data: {
            sessionsRevoked: number;
        };
    }>;
    logout(user: RequestUser, dto: AdminLogoutDto, ip: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
        };
    }>;
}
