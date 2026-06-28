import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SyncRazorpayPaymentDto {
  @ApiProperty({ description: 'Checkout id from initiate checkout' })
  @IsString()
  checkoutId: string;
}
