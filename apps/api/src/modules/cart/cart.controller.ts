import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current buyer cart with totals' })
  @ApiResponse({ status: 200, description: 'Active cart or null if no cart exists' })
  async getCart(@CurrentUser() user: RequestUser) {
    const data = await this.cartService.getCart(user.id);
    return { success: true, data };
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add a variant to the cart',
    description:
      'Creates the cart if it does not exist. Returns 409 if the item is from a different store.',
  })
  @ApiResponse({ status: 200, description: 'Updated cart' })
  @ApiResponse({ status: 400, description: 'Out of stock or requested qty exceeds available stock' })
  @ApiResponse({ status: 409, description: 'Item is from a different store than current cart' })
  async addItem(
    @CurrentUser() user: RequestUser,
    @Body() dto: AddCartItemDto,
    @Ip() ip: string,
  ) {
    const data = await this.cartService.addItem(user.id, dto, ip);
    return { success: true, data };
  }

  @Post('reorder/:orderId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId', description: 'Past order to reorder from' })
  @ApiOperation({
    summary: 'Reorder — rebuild the cart from a past order',
    description: 'Replaces the current cart with the order\'s items. Unavailable items are skipped.',
  })
  @ApiResponse({ status: 200, description: 'Updated cart with added/skipped counts' })
  async reorder(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Ip() ip: string,
  ) {
    const data = await this.cartService.reorderFromOrder(user.id, orderId, ip);
    return { success: true, data };
  }

  @Patch('items/:id')
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiOperation({
    summary: 'Update item quantity. Setting quantity to 0 removes the item.',
  })
  async updateItem(
    @CurrentUser() user: RequestUser,
    @Param('id') cartItemId: string,
    @Body() dto: UpdateCartItemDto,
    @Ip() ip: string,
  ) {
    const data = await this.cartService.updateItem(user.id, cartItemId, dto, ip);
    return { success: true, data };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Cart item ID' })
  @ApiOperation({ summary: 'Remove a single item from the cart' })
  async removeItem(
    @CurrentUser() user: RequestUser,
    @Param('id') cartItemId: string,
    @Ip() ip: string,
  ) {
    const data = await this.cartService.removeItem(user.id, cartItemId, ip);
    return { success: true, data };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear the entire cart (removes all items and deletes the cart)' })
  async clearCart(@CurrentUser() user: RequestUser, @Ip() ip: string) {
    await this.cartService.clearCart(user.id, ip);
    return { success: true, data: { message: 'Cart cleared' } };
  }
}
