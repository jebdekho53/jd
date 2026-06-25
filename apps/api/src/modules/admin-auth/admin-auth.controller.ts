import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { AdminAuthService } from './admin-auth.service';
import {
  AdminChangePasswordDto,
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminLogoutDto,
  AdminResetPasswordDto,
  UpdateAdminSettingsDto,
} from './dto/admin-auth.dto';

@ApiTags(Tags.ADMIN)
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 5, limit: 10 } })
  @Post('login')
  @ApiOperation({ summary: 'Admin email/password login' })
  async login(@Body() dto: AdminLoginDto, @Ip() ip: string, @Req() req: Request) {
    const result = await this.adminAuth.login(dto, ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 10, limit: 5 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request admin password reset email' })
  async forgotPassword(@Body() dto: AdminForgotPasswordDto) {
    const result = await this.adminAuth.forgotPassword(dto);
    return { success: true, data: result };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000 * 5, limit: 10 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset admin password with token' })
  async resetPassword(
    @Body() dto: AdminResetPasswordDto,
    @Ip() ip: string,
  ) {
    const result = await this.adminAuth.resetPassword(dto, ip);
    return { success: true, data: result };
  }

  @Public()
  @Get('login-stats')
  @ApiOperation({ summary: 'Public platform stats for admin login page' })
  async loginStats() {
    const data = await this.adminAuth.getLoginStats();
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('me')
  @ApiOperation({ summary: 'Current admin profile' })
  async me(@CurrentUser() user: RequestUser) {
    const data = await this.adminAuth.getMe(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('settings')
  @ApiOperation({ summary: 'Admin account settings' })
  async getSettings(@CurrentUser() user: RequestUser) {
    const data = await this.adminAuth.getSettingsForUser(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('settings')
  @ApiOperation({ summary: 'Update admin account settings' })
  async updateSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateAdminSettingsDto,
    @Ip() ip: string,
  ) {
    const data = await this.adminAuth.updateSettings(user.id, dto, ip);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change admin password' })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: AdminChangePasswordDto,
    @Ip() ip: string,
  ) {
    const data = await this.adminAuth.changePassword(user.id, dto, ip);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('sessions')
  @ApiOperation({ summary: 'List active admin sessions' })
  async sessions(@CurrentUser() user: RequestUser) {
    const data = await this.adminAuth.listSessions(user.id);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a single admin session' })
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    const data = await this.adminAuth.revokeSession(user.id, sessionId);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: RequestUser, @Ip() ip: string) {
    const data = await this.adminAuth.revokeAllSessions(user.id, ip);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @CurrentUser() user: RequestUser,
    @Body() dto: AdminLogoutDto,
    @Ip() ip: string,
  ) {
    const data = await this.adminAuth.logout(user.id, dto.refreshToken, ip);
    return { success: true, data };
  }
}
