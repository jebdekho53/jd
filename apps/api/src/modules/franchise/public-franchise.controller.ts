import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { FranchiseApplicationService } from './franchise-application.service';
import { SubmitFranchiseApplicationDto } from './dto/franchise.dto';

@ApiTags(Tags.MERCHANTS)
@Controller('franchise')
export class PublicFranchiseController {
  constructor(private readonly applications: FranchiseApplicationService) {}

  /**
   * Public franchise application funnel. Unauthenticated by design — a prospective
   * franchisee is not yet a user of any kind.
   *
   * Rate-limited to 5 submissions per 10 minutes per IP. The response carries only
   * the caller's own lead id and status, so it cannot be used to discover whether a
   * phone, city or territory is already taken.
   */
  @Public()
  @Throttle({ default: { ttl: 60000 * 10, limit: 5 } })
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a franchise partner application' })
  async apply(@Body() dto: SubmitFranchiseApplicationDto) {
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
