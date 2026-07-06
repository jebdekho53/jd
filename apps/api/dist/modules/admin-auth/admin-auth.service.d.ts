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
    }>;
    getSettingsForUser(userId: string): Promise<{
        name: any;
        email: any;
        phone: any;
        department: any;
        credentialSource: any;
        lastLoginAt: any;
        passwordChangedAt: any;
    }>;
    updateSettings(userId: string, dto: UpdateAdminSettingsDto, ipAddress?: string): Promise<{
        name: any;
        email: any;
        phone: any;
        department: any;
        credentialSource: any;
        lastLoginAt: any;
        passwordChangedAt: any;
    }>;
    listSessions(userId: string): Promise<any>;
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
        activeStores: any;
        totalOrders: any;
        activeRiders: any;
        merchants: any;
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
