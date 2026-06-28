import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequestUser } from '../../common/types';
import { FoodPaymentService } from './food-payment.service';
import { VerifyFoodPaymentDto } from './dto/verify-food-payment.dto';

@ApiTags('food / checkout')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@Controller('buyer/food-checkout/razorpay')
export class FoodPaymentController {
  constructor(private readonly payment: FoodPaymentService) {}

  @Post('create-order/:checkoutId')
  @ApiOperation({ summary: 'Create Razorpay order for pending food checkout (no merchant order yet)' })
  async createOrder(
    @CurrentUser() user: RequestUser,
    @Param('checkoutId') checkoutId: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    const ip = forwardedFor?.split(',')[0]?.trim();
    const data = await this.payment.createRazorpayOrder(user.id, checkoutId, ip);
    return { success: true, data };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify Razorpay payment and create food order' })
  async verify(
    @CurrentUser() user: RequestUser,
    @Body() dto: VerifyFoodPaymentDto,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    const ip = forwardedFor?.split(',')[0]?.trim();
    const data = await this.payment.verifyPayment(user.id, dto, ip);
    return { success: true, data };
  }

  @Post('sync/:checkoutId')
  @ApiOperation({ summary: 'Sync captured Razorpay payment for food checkout' })
  async sync(
    @CurrentUser() user: RequestUser,
    @Param('checkoutId') checkoutId: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    const ip = forwardedFor?.split(',')[0]?.trim();
    const data = await this.payment.syncPayment(user.id, checkoutId, ip);
    return { success: true, data };
  }
}
