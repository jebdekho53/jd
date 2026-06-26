import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminMediaService } from './admin-media.service';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}

  @Get('coverage')
  @Permissions('categories:read')
  @ApiOperation({ summary: 'Report catalog items missing required images' })
  async coverage() {
    const data = await this.media.getCoverageReport();
    return { success: true, data };
  }
}
