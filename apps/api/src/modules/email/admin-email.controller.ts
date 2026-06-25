import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { EmailNotificationService } from './email-notification.service';
import { TestEmailDto } from './dto/test-email.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/system')
export class AdminEmailController {
  constructor(private readonly emails: EmailNotificationService) {}

  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test email via production SMTP (admin only)' })
  async testEmail(@Body() dto: TestEmailDto) {
    const result = await this.emails.sendTestEmail(dto.email.trim().toLowerCase());
    return {
      success: true,
      data: {
        sent: result.success,
        recipient: dto.email,
        message: result.success
          ? 'Test email sent successfully'
          : 'Failed to send test email — check SMTP configuration and email logs',
      },
    };
  }
}
