import { UserStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { VerificationBlocklistService } from '../merchant/verification-blocklist.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { RiskEngineService } from '../trust-safety/risk-engine.service';
import { ReferralService } from '../wallet-loyalty/referral.service';
import { WalletService } from '../wallet-loyalty/wallet.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { OtpService } from './otp.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EmailLoginDto } from './dto/login.dto';
import { EmailSignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { StepUpDto } from './dto/step-up.dto';
import { TokenPair } from './interfaces/token-pair.interface';
export interface MeResponse {
    id: string;
    phone: string;
    email: string | null;
    name: string | null;
    status: UserStatus;
    phoneVerified: boolean;
    emailVerified: boolean;
    isVerified: boolean;
    roles: string[];
    permissions: string[];
    createdAt: Date;
}
export declare function isBuyerFullyVerified(input: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    phoneVerified: boolean;
    emailVerified: boolean;
}): boolean;
export interface RequestOtpResponse {
    message: string;
    expiresIn: number;
    phone?: string;
}
export interface VerifyOtpResponse extends TokenPair {
    user: MeResponse;
    isNewUser: boolean;
}
export declare class AuthService {
    private readonly prisma;
    private readonly otpService;
    private readonly tokenService;
    private readonly passwordService;
    private readonly wallet;
    private readonly referral;
    private readonly riskEngine;
    private readonly redis;
    private readonly auditService;
    private readonly domainEvents;
    private readonly blocklist;
    private readonly trustSafety;
    private readonly emailNotifications;
    private readonly logger;
    private readonly cfg;
    constructor(prisma: PrismaService, otpService: OtpService, tokenService: TokenService, passwordService: PasswordService, wallet: WalletService, referral: ReferralService, riskEngine: RiskEngineService, redis: RedisService, auditService: AuditService, domainEvents: DomainEventsService, blocklist: VerificationBlocklistService, trustSafety: TrustSafetyHookService, emailNotifications: EmailNotificationService, configService: ConfigService);
    private assertEmailAuthEnabled;
    private assertPhoneOtpEnabled;
    requestOtp(dto: RequestOtpDto, ipAddress?: string, userAgent?: string): Promise<RequestOtpResponse>;
    verifyOtp(dto: VerifyOtpDto, ipAddress?: string, userAgent?: string): Promise<VerifyOtpResponse>;
    signup(dto: EmailSignupDto, ipAddress?: string, userAgent?: string): Promise<VerifyOtpResponse>;
    login(dto: EmailLoginDto, ipAddress?: string, userAgent?: string): Promise<VerifyOtpResponse>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
        expiresIn?: number;
        phone?: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    refresh(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<TokenPair>;
    logout(userId: string, rawRefreshToken: string | undefined, ipAddress?: string, userAgent?: string): Promise<void>;
    logoutAll(userId: string, ipAddress?: string, userAgent?: string): Promise<{
        sessionsRevoked: number;
    }>;
    getMe(userId: string): Promise<MeResponse>;
    private resolveBuyerRole;
    private ensureBuyerAccess;
    private registerNewBuyer;
    private applyBuyerRegistration;
    private finalizeBuyerRegistration;
    private completeAuthentication;
    stepUp(userId: string, dto: StepUpDto, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    private generatePlaceholderPhone;
    private sendWelcomeEmailIfPossible;
}
