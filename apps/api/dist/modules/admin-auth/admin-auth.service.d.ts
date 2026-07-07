import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { TokenService } from '../auth/token.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { AdminPasswordService } from './admin-password.service';
import { AdminChangePasswordDto, AdminForgotPasswordDto, AdminLoginDto, AdminResetPasswordDto, UpdateAdminSettingsDto } from './dto/admin-auth.dto';
export declare class AdminAuthService {
    private readonly prisma;
    private readonly redis;
    private readonly tokenService;
    private readonly passwordService;
    private readonly audit;
    private readonly domainEvents;
    private readonly emailNotifications;
    private readonly logger;
    private readonly cfg;
    constructor(prisma: PrismaService, redis: RedisService, tokenService: TokenService, passwordService: AdminPasswordService, audit: AuditService, domainEvents: DomainEventsService, emailNotifications: EmailNotificationService, configService: ConfigService);
    login(dto: AdminLoginDto, ipAddress?: string, userAgent?: string): Promise<{
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
    }>;
    forgotPassword(dto: AdminForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: AdminResetPasswordDto, ipAddress?: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: AdminChangePasswordDto, ipAddress?: string): Promise<{
        message: string;
    }>;
    getMe(userId: string): Promise<{
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
    }>;
    getSettingsForUser(userId: string): Promise<{
        name: string;
        email: string | null;
        phone: string;
        department: string | null;
        credentialSource: import("@prisma/client").$Enums.AdminCredentialSource;
        lastLoginAt: Date | null;
        passwordChangedAt: Date | null;
    }>;
    updateSettings(userId: string, dto: UpdateAdminSettingsDto, ipAddress?: string): Promise<{
        name: string;
        email: string | null;
        phone: string;
        department: string | null;
        credentialSource: import("@prisma/client").$Enums.AdminCredentialSource;
        lastLoginAt: Date | null;
        passwordChangedAt: Date | null;
    }>;
    listSessions(userId: string): Promise<{
        id: string;
        deviceName: string | null | undefined;
        ipAddress: string | null | undefined;
        rememberMe: boolean;
        lastActiveAt: Date;
        createdAt: Date;
        expiresAt: Date | undefined;
    }[]>;
    revokeSession(userId: string, sessionId: string): Promise<{
        success: boolean;
    }>;
    revokeAllSessions(userId: string, ipAddress?: string): Promise<{
        sessionsRevoked: number;
    }>;
    logout(userId: string, rawRefreshToken?: string, ipAddress?: string): Promise<{
        success: boolean;
    }>;
    getLoginStats(): Promise<{
        activeStores: number;
        totalOrders: number;
        activeRiders: number;
        merchants: number;
    }>;
    private getSettings;
    private hasAnyAdminUser;
    private findAdminUserByEmail;
    private findAdminUserById;
    private tryEnvBootstrap;
    private recordFailedLogin;
    private recordAudit;
    private enforceLoginRateLimit;
    private issueTokens;
    private revokeAllAdminSessions;
    private isNewDeviceLogin;
    private formatMe;
}
