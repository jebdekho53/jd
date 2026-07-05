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
                id: string;
                phone: string;
                email: string | null;
                status: import("@prisma/client").$Enums.UserStatus;
                phoneVerified: boolean;
                roles: import("@prisma/client").$Enums.RoleName[];
                permissions: string[];
                createdAt: Date;
                adminProfile: {
                    name: string;
                    department: string | null;
                    isSuperAdmin: boolean;
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
            activeStores: number;
            totalOrders: number;
            activeRiders: number;
            merchants: number;
        };
    }>;
    me(user: RequestUser): Promise<{
        success: boolean;
        data: {
            id: string;
            phone: string;
            email: string | null;
            status: import("@prisma/client").$Enums.UserStatus;
            phoneVerified: boolean;
            roles: import("@prisma/client").$Enums.RoleName[];
            permissions: string[];
            createdAt: Date;
            adminProfile: {
                name: string;
                department: string | null;
                isSuperAdmin: boolean;
            } | null;
        };
    }>;
    getSettings(user: RequestUser): Promise<{
        success: boolean;
        data: {
            name: string;
            email: string | null;
            phone: string;
            department: string | null;
            credentialSource: import("@prisma/client").$Enums.AdminCredentialSource;
            lastLoginAt: Date | null;
            passwordChangedAt: Date | null;
        };
    }>;
    updateSettings(user: RequestUser, dto: UpdateAdminSettingsDto, ip: string): Promise<{
        success: boolean;
        data: {
            name: string;
            email: string | null;
            phone: string;
            department: string | null;
            credentialSource: import("@prisma/client").$Enums.AdminCredentialSource;
            lastLoginAt: Date | null;
            passwordChangedAt: Date | null;
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
        data: {
            id: string;
            deviceName: string | null | undefined;
            ipAddress: string | null | undefined;
            rememberMe: boolean;
            lastActiveAt: Date;
            createdAt: Date;
            expiresAt: Date | undefined;
        }[];
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
