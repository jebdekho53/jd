import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { AdminMerchantService } from './admin-merchant.service';
import { RemoveBlacklistDto } from './dto/remove-blacklist.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('SUPER_ADMIN')
@Controller('admin/merchants')
export class AdminMerchantController {
  constructor(private readonly adminMerchantService: AdminMerchantService) {}

  @Post(':merchantProfileId/remove-blacklist')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'merchantProfileId', description: 'Merchant profile ID' })
  @ApiOperation({ summary: 'Remove merchant blacklist and optionally reopen a store (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Blacklist removed' })
  async removeBlacklist(
    @CurrentUser() user: RequestUser,
    @Param('merchantProfileId') merchantProfileId: string,
    @Body() dto: RemoveBlacklistDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const data = await this.adminMerchantService.removeBlacklist(
      user.id,
      merchantProfileId,
      dto,
      ip,
      req.headers['user-agent'],
    );
    return { success: true, data };
  }
}
