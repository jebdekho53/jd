import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { RiderOnboardingService } from './rider-onboarding.service';
import { RegisterRiderDto } from './dto/register-rider.dto';

/**
 * Rider self-signup. Any authenticated user (every OTP login already grants the
 * BUYER role) can apply to become a rider — no RIDER role required to reach this
 * endpoint, unlike the rest of RiderController.
 */
@ApiTags('rider')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('rider')
export class RiderOnboardingController {
  constructor(private readonly onboarding: RiderOnboardingService) {}

  @Post('register')
  @ApiOperation({ summary: 'Apply to become a rider (creates profile, grants RIDER role, KYC pending)' })
  async register(@CurrentUser() user: RequestUser, @Body() dto: RegisterRiderDto) {
    const data = await this.onboarding.register(user.id, dto);
    return { success: true, data };
  }
}
