import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { ApiTags as Tags } from '../../common/constants';
import { CartService } from '../cart/cart.service';
import { PromotionCartService } from './promotion-cart.service';
import { ApplyCouponDto } from './dto/promotion.dto';

@ApiTags(Tags.BUYERS)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer')
export class BuyerPromotionController {
  constructor(
    private readonly cartService: CartService,
    private readonly promoCart: PromotionCartService,
  ) {}

  @Post('cart/coupon/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon against the current cart' })
  async validateCoupon(@CurrentUser() user: RequestUser, @Body() dto: ApplyCouponDto) {
    const cart = await this.cartService.getCart(user.id);
    if (!cart) return { success: true, data: { valid: false, message: 'Cart is empty' } };
    const buyerProfileId = await this.cartService.getBuyerProfileId(user.id);
    const result = await this.promoCart.validateCoupon(buyerProfileId, dto.code, cart);
    return { success: true, data: result };
  }

  @Post('cart/coupon/apply')
  @HttpCode(HttpStatus.OK)
  async applyCoupon(@CurrentUser() user: RequestUser, @Body() dto: ApplyCouponDto) {
    await this.promoCart.applyCoupon(user.id, dto.code);
    await this.cartService.invalidateCache(user.id);
    const data = await this.cartService.getCart(user.id);
    return { success: true, data };
  }

  @Delete('cart/coupon')
  @HttpCode(HttpStatus.OK)
  async removeCoupon(@CurrentUser() user: RequestUser) {
    await this.promoCart.removeCoupon(user.id);
    await this.cartService.invalidateCache(user.id);
    const data = await this.cartService.getCart(user.id);
    return { success: true, data };
  }
}
