import { Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types';
import { PrismaService } from '../../database/prisma.service';
import { ReturnPickupService } from './return-pickup.service';

/** Reverse-logistics pickups a rider handles: collect from buyer → drop at store. */
@ApiTags('Rider')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RIDER')
@Controller('rider/return-pickups')
export class RiderReturnPickupController {
  constructor(
    private readonly pickups: ReturnPickupService,
    private readonly prisma: PrismaService,
  ) {}

  private async riderProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.riderProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new ForbiddenException('Rider profile required');
    return profile.id;
  }

  @Get()
  @ApiOperation({ summary: 'Return pickups assigned to this rider' })
  async list(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.pickups.listForRider(await this.riderProfileId(user.id)) };
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  async accept(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.pickups.riderTransition(id, await this.riderProfileId(user.id), 'accept');
    return { success: true, data };
  }

  @Post(':id/picked-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Collected the item from the buyer' })
  async pickedUp(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.pickups.riderTransition(id, await this.riderProfileId(user.id), 'picked-up');
    return { success: true, data };
  }

  @Post(':id/completed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dropped the item at the store — triggers the buyer refund' })
  async completed(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.pickups.riderTransition(id, await this.riderProfileId(user.id), 'completed');
    return { success: true, data };
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Can't do this pickup — release it back to the pool" })
  async decline(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.pickups.riderDecline(id, await this.riderProfileId(user.id));
    return { success: true };
  }
}
