import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { EmailSignupDto } from './dto/signup.dto';
import { EmailLoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { StepUpDto } from './dto/step-up.dto';

@ApiTags(Tags.AUTH)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --------------------------------------------------------------------------
  // POST /auth/request-otp
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 10, limit: 3 } })
  @Post('request-otp')
  @ApiOperation({ summary: 'Request a 6-digit OTP via SMS' })
  @ApiResponse({ status: 200, description: 'OTP dispatched' })
  @ApiResponse({ status: 429, description: 'Too many OTP requests' })
  async requestOtp(
    @Body() dto: RequestOtpDto,
    @Ip() ip: string,
  ) {
    const result = await this.authService.requestOtp(dto, ip);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 10, limit: 3 } })
  @Post('send-otp')
  @ApiOperation({ summary: 'Alias for request-otp' })
  async sendOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.requestOtp(dto, ip);
  }

  // --------------------------------------------------------------------------
  // POST /auth/verify-otp
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 5, limit: 10 } })
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP — auto-registers if new user, issues JWT pair' })
  @ApiResponse({ status: 200, description: 'Tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const result = await this.authService.verifyOtp(dto, ip, req.headers['user-agent']);
    return {
      success: true,
      data: result,
    };
  }

  // --------------------------------------------------------------------------
  // POST /auth/signup — email registration
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000 * 10, limit: 5 } })
  @Post('signup')
  @ApiOperation({ summary: 'Register with email and password' })
  async signup(
    @Body() dto: EmailSignupDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const result = await this.authService.signup(dto, ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  // --------------------------------------------------------------------------
  // POST /auth/login — email + password
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 5, limit: 10 } })
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: EmailLoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const result = await this.authService.login(dto, ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  // --------------------------------------------------------------------------
  // POST /auth/forgot-password
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 10, limit: 3 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset via email link or mobile OTP' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return { success: true, data: result };
  }

  // --------------------------------------------------------------------------
  // POST /auth/reset-password
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 5, limit: 10 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with email token or mobile OTP' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return { success: true, data: result };
  }

  // --------------------------------------------------------------------------
  // POST /auth/refresh
  // --------------------------------------------------------------------------
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token — returns new access + refresh pair' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const tokens = await this.authService.refresh(dto, ip, req.headers['user-agent']);
    return {
      success: true,
      data: tokens,
    };
  }

  // --------------------------------------------------------------------------
  // POST /auth/logout
  // --------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke current device session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: LogoutDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    await this.authService.logout(user.id, dto.refreshToken, ip, req.headers['user-agent']);
    return {
      success: true,
      data: { message: 'Logged out successfully' },
    };
  }

  // --------------------------------------------------------------------------
  // POST /auth/step-up
  // --------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('step-up')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Step-up authentication via password or OTP' })
  @ApiResponse({ status: 200, description: 'Step-up authentication successful' })
  async stepUp(
    @CurrentUser() user: RequestUser,
    @Body() dto: StepUpDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.authService.stepUp(user.id, dto, ip, req.headers['user-agent']);
    return {
      success: true,
      data,
    };
  }

  // --------------------------------------------------------------------------
  // POST /auth/logout-all
  // --------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions for this user' })
  @ApiResponse({ status: 200, description: 'All sessions revoked' })
  async logoutAll(
    @CurrentUser() user: RequestUser,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const result = await this.authService.logoutAll(user.id, ip, req.headers['user-agent']);
    return {
      success: true,
      data: result,
    };
  }

  // --------------------------------------------------------------------------
  // GET /auth/me
  // --------------------------------------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async me(@CurrentUser() user: RequestUser) {
    const profile = await this.authService.getMe(user.id);
    return {
      success: true,
      data: profile,
    };
  }
}
