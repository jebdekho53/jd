import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_Xxxxxxxxxxxxx', description: 'Razorpay order ID' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_Xxxxxxxxxxxxx', description: 'Razorpay payment ID' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'HMAC-SHA256 signature from Razorpay' })
  @IsString()
  razorpaySignature: string;
}
