import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { RequestUser } from '../../common/types';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';

@ApiTags('checkout')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, StepUpGuard)
@Roles('BUYER')
@Controller('buyer/checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @RequireStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'UUID for idempotency protection. Required.',
    required: true,
  })
  @ApiOperation({
    summary: 'Initiate checkout (online payment — Razorpay)',
    description:
      'Reserves inventory for 15 minutes. Returns checkoutId — use it to create a ' +
      'Razorpay payment order at POST /payments/razorpay/create-order.',
  })
  @ApiResponse({ status: 201, description: 'Checkout initiated and inventory reserved' })
  @ApiResponse({ status: 400, description: 'Cart empty, product unavailable, or insufficient stock' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async initiateCheckout(
    @CurrentUser() user: RequestUser,
    @Body() dto: InitiateCheckoutDto,
    @Ip() ip: string,
  ) {
    const data = await this.checkoutService.initiateCheckout(user.id, dto, ip);
    return { success: true, data };
  }

  @Post('cod')
  @RequireStepUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'UUID for idempotency protection. Required.',
    required: true,
  })
  @ApiOperation({
    summary: 'Initiate COD checkout — reserves stock and creates order immediately',
    description: 'No payment gateway. Order is created with MERCHANT_ACCEPTED status.',
  })
  @ApiResponse({ status: 201, description: 'COD order created' })
  async initiateCodCheckout(
    @CurrentUser() user: RequestUser,
    @Body() dto: InitiateCheckoutDto,
    @Ip() ip: string,
  ) {
    const data = await this.checkoutService.initiateCodCheckout(user.id, dto, ip);
    return { success: true, data };
  }

  @Get(':checkoutId')
  @ApiParam({ name: 'checkoutId' })
  @ApiOperation({ summary: 'Get checkout status — includes expiry and linked orderId' })
  @ApiResponse({ status: 200, description: 'Checkout detail' })
  @ApiResponse({ status: 403, description: 'Checkout belongs to another buyer' })
  @ApiResponse({ status: 404, description: 'Checkout not found' })
  async getCheckout(
    @CurrentUser() user: RequestUser,
    @Param('checkoutId') checkoutId: string,
  ) {
    const data = await this.checkoutService.getCheckout(user.id, checkoutId);
    return { success: true, data };
  }
}
