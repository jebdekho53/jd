import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyFoodPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  foodCheckoutId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;
}
