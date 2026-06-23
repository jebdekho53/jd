import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateRazorpayOrderDto {
  @ApiProperty({ description: 'checkoutId from POST /buyer/checkout' })
  @IsString()
  checkoutId: string;
}
