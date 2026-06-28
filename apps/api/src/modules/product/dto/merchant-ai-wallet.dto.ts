import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateAiWalletRechargeDto {
  @ApiProperty({ example: 10000, description: 'Amount in paise (minimum ₹100)' })
  @IsInt()
  @Min(10000)
  amountPaise: number;
}

export class VerifyAiWalletRechargeDto {
  @ApiProperty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty()
  @IsString()
  razorpaySignature: string;
}

export class AdminAdjustAiWalletDto {
  @ApiProperty({ description: 'Positive to credit, negative to debit' })
  @IsInt()
  amountPaise: number;

  @ApiProperty()
  @IsString()
  reason: string;
}
