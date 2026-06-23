import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequestUser } from '../../common/types';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { PaymentService } from './payment.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ── Create Razorpay order ───────────────────────────────────────────────

  @Post('razorpay/create-order')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({
    summary: 'Get Razorpay order details for an existing checkout',
    description: 'Idempotent — re-calling with the same checkoutId returns the same Razorpay order.',
  })
  async createRazorpayOrder(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateRazorpayOrderDto,
    @Ip() ip: string,
  ) {
    const data = await this.paymentService.createRazorpayOrder(user.id, dto, ip);
    return { success: true, data };
  }

  // ── Verify payment ─────────────────────────────────────────────────────

  @Post('razorpay/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({
    summary: 'Verify Razorpay payment signature and confirm order',
    description:
      'Verifies HMAC-SHA256 signature, consumes inventory reservations, and advances ' +
      'order to CREATED status. Idempotent — repeat calls return the original response.',
  })
  @ApiResponse({ status: 200, description: 'Payment verified, order confirmed' })
  @ApiResponse({ status: 401, description: 'Signature verification failed' })
  async verifyPayment(
    @CurrentUser() user: RequestUser,
    @Body() dto: VerifyPaymentDto,
    @Ip() ip: string,
  ) {
    const data = await this.paymentService.verifyPayment(user.id, dto, ip);
    return { success: true, data };
  }

  // ── Razorpay webhook ────────────────────────────────────────────────────

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Razorpay webhook endpoint',
    description:
      'Verifies X-Razorpay-Signature before processing. Handles payment.captured and ' +
      'payment.failed events. Always returns 200 to Razorpay to prevent retries on ' +
      'non-critical errors.',
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      return { success: false };
    }
    await this.paymentService.handleWebhook(rawBody, signature);
    return { success: true };
  }
}
