import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags as Tags } from '../../common/constants';
import { AdminUserService } from './admin-user.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';
import { SuspendAdminUserDto } from './dto/suspend-admin-user.dto';

@ApiTags(Tags.ADMIN)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly users: AdminUserService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'List platform users with optional role/search filters' })
  async list(@Query() dto: ListAdminUsersDto) {
    const result = await this.users.listUsers(dto);
    return { success: true, ...result };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @Permissions('users:write')
  @ApiOperation({ summary: 'Suspend a platform user' })
  async suspend(@Param('id') id: string, @Body() _dto: SuspendAdminUserDto) {
    const data = await this.users.suspendUser(id);
    return { success: true, data };
  }
}
