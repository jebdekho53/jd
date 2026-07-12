import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class LinkRouteAccountDto {
  @ApiPropertyOptional({
    description:
      'Existing Razorpay linked account id (acc_xxx) to attach. Omit to create a new one from the merchant’s KYC bank details.',
    example: 'acc_XXXXXXXXXXXXXX',
  })
  @IsOptional()
  @IsString()
  @Matches(/^acc_[A-Za-z0-9]+$/, { message: 'accountId must be a Razorpay linked account id (acc_...)' })
  accountId?: string;
}
