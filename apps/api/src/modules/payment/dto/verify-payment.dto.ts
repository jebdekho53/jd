import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'checkoutId from POST /buyer/checkout response' })
  @IsString()
  checkoutId: string;

  @ApiProperty({ description: 'razorpay_order_id from Razorpay response' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'razorpay_payment_id from Razorpay response' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'razorpay_signature from Razorpay response' })
  @IsString()
  razorpaySignature: string;
}
