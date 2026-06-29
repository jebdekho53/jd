import { Request } from 'express';
import { RequestUser } from '../../common/types';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { EmailSignupDto } from './dto/signup.dto';
import { EmailLoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    requestOtp(dto: RequestOtpDto, ip: string): Promise<{
        success: boolean;
        data: import("./auth.service").RequestOtpResponse;
    }>;
    sendOtp(dto: RequestOtpDto, ip: string): Promise<{
        success: boolean;
        data: import("./auth.service").RequestOtpResponse;
    }>;
    verifyOtp(dto: VerifyOtpDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: import("./auth.service").VerifyOtpResponse;
    }>;
    signup(dto: EmailSignupDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: import("./auth.service").VerifyOtpResponse;
    }>;
    login(dto: EmailLoginDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: import("./auth.service").VerifyOtpResponse;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
            expiresIn?: number;
            phone?: string;
        };
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    refresh(dto: RefreshTokenDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: import("./interfaces/token-pair.interface").TokenPair;
    }>;
    logout(user: RequestUser, dto: LogoutDto, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    logoutAll(user: RequestUser, ip: string, req: Request): Promise<{
        success: boolean;
        data: {
            sessionsRevoked: number;
        };
    }>;
    me(user: RequestUser): Promise<{
        success: boolean;
        data: import("./auth.service").MeResponse;
    }>;
}
