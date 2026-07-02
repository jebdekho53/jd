import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { WishlistService } from './wishlist.service';

class AddWishlistDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;
}

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'List the buyer wishlist' })
  async list(@CurrentUser() user: RequestUser) {
    return { success: true, data: await this.wishlist.list(user.id) };
  }

  @Post()
  @ApiOperation({ summary: 'Add a product to the wishlist' })
  async add(@CurrentUser() user: RequestUser, @Body() dto: AddWishlistDto) {
    return { success: true, data: await this.wishlist.add(user.id, dto.productId) };
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from the wishlist' })
  async remove(@CurrentUser() user: RequestUser, @Param('productId') productId: string) {
    return { success: true, data: await this.wishlist.remove(user.id, productId) };
  }
}
