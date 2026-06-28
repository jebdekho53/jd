import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { FoodCartService } from './food-cart.service';
import { AddFoodCartItemDto, UpdateFoodCartItemDto } from './dto/add-food-cart-item.dto';

@ApiTags('food / cart')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/food-cart')
export class FoodCartController {
  constructor(private readonly foodCart: FoodCartService) {}

  @Get()
  @ApiOperation({ summary: 'Get food cart (separate from grocery cart)' })
  async getCart(@CurrentUser() user: RequestUser) {
    const data = await this.foodCart.getFoodCart(user.id);
    return { success: true, data };
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(@CurrentUser() user: RequestUser, @Body() dto: AddFoodCartItemDto) {
    const data = await this.foodCart.addItem(user.id, dto);
    return { success: true, data };
  }

  @Patch('items/:id')
  async updateItem(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateFoodCartItemDto,
  ) {
    const data = await this.foodCart.updateItem(user.id, id, dto);
    return { success: true, data };
  }

  @Delete('items/:id')
  async removeItem(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const data = await this.foodCart.removeItem(user.id, id);
    return { success: true, data };
  }

  @Delete()
  async clearCart(@CurrentUser() user: RequestUser) {
    const data = await this.foodCart.clearCart(user.id);
    return { success: true, data };
  }
}
