import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { VendorApplicationService } from './vendor-application.service';
import { SubmitVendorApplicationDto } from './dto/vendor-application.dto';

@ApiTags(Tags.MERCHANTS)
@Controller('vendor-applications')
export class PublicVendorApplicationController {
  constructor(private readonly applications: VendorApplicationService) {}

  /**
   * Public vendor-partner application funnel. Unauthenticated by design — a
   * prospective vendor is not yet a user of any kind.
   *
   * Rate-limited to 5 submissions per 10 minutes per IP, same as franchise
   * onboarding. The response carries only the caller's own application id and
   * status, so it cannot be used to discover whether a phone is already taken.
   */
  @Public()
  @Throttle({ default: { ttl: 60000 * 10, limit: 5 } })
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a vendor partner application' })
  async apply(@Body() dto: SubmitVendorApplicationDto) {
    const result = await this.applications.submitApplication(dto);
    return {
      success: true,
      data: { id: result.id, status: result.status },
      message: result.duplicate
        ? 'We already have your application and will be in touch.'
        : 'Application received. Our team will contact you shortly.',
    };
  }
}
